import os
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

from deep_translator import GoogleTranslator
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from faster_whisper import WhisperModel
from gtts import gTTS


app = FastAPI(
    title="Video Language Translator API",
    description="Upload a video and receive an automatically dubbed version in a target language.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
OUTPUT_DIR = Path(os.getenv("AI_BACKEND_OUTPUT_DIR", "AI Backend/outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_whisper_model: WhisperModel | None = None


LANGUAGE_MAP = {
    "english": "en",
    "hindi": "hi",
    "spanish": "es",
    "french": "fr",
    "german": "de",
    "japanese": "ja",
    "korean": "ko",
    "portuguese": "pt",
    "italian": "it",
    "arabic": "ar",
    "russian": "ru",
    "chinese": "zh-CN",
}


def get_whisper_model() -> WhisperModel:
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _whisper_model


def resolve_target_language_code(language: str) -> str:
    normalized = language.strip().lower()
    return LANGUAGE_MAP.get(normalized, normalized)


def run_ffmpeg(command: list[str]) -> None:
    process = subprocess.run(command, capture_output=True, text=True)
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "ffmpeg failed")


def extract_audio(video_path: Path, audio_path: Path) -> None:
    run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-vn",
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            str(audio_path),
        ]
    )


def transcribe_audio(audio_path: Path) -> tuple[str, str | None]:
    model = get_whisper_model()
    segments, info = model.transcribe(str(audio_path), beam_size=5)
    transcript = " ".join(segment.text.strip() for segment in segments).strip()
    if not transcript:
        raise RuntimeError("No speech detected in the uploaded video.")
    return transcript, info.language


def translate_text(text: str, target_language_code: str) -> str:
    return GoogleTranslator(source="auto", target=target_language_code).translate(text)


def synthesize_speech(text: str, target_language_code: str, output_path: Path) -> None:
    tts = gTTS(text=text, lang=target_language_code)
    tts.save(str(output_path))


def dub_video(video_path: Path, dub_audio_path: Path, output_video_path: Path) -> None:
    run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(dub_audio_path),
            "-map",
            "0:v:0",
            "-map",
            "1:a:0",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-shortest",
            str(output_video_path),
        ]
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/translate-video")
async def translate_video(
    file: UploadFile = File(...),
    target_language: str = Form(...),
) -> JSONResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a name.")

    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Please upload a valid video file.")

    target_language_code = resolve_target_language_code(target_language)

    job_id = uuid.uuid4().hex
    job_dir = Path(tempfile.mkdtemp(prefix=f"video_translate_{job_id}_"))

    video_path = job_dir / file.filename
    extracted_audio_path = job_dir / "source_audio.wav"
    dubbed_audio_path = job_dir / "dubbed_audio.mp3"
    output_video_path = OUTPUT_DIR / f"dubbed_{job_id}.mp4"

    try:
        with open(video_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        extract_audio(video_path, extracted_audio_path)
        transcript, detected_language = transcribe_audio(extracted_audio_path)

        translated_text = translate_text(transcript, target_language_code)
        synthesize_speech(translated_text, target_language_code, dubbed_audio_path)
        dub_video(video_path, dubbed_audio_path, output_video_path)

        return JSONResponse(
            {
                "message": "Video dubbed successfully.",
                "job_id": job_id,
                "detected_language": detected_language,
                "target_language": target_language_code,
                "transcript": transcript,
                "translated_text": translated_text,
                "download_url": f"/download/{output_video_path.name}",
            }
        )

    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Unexpected error: {error}") from error
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)
        await file.close()


@app.get("/download/{filename}")
def download_video(filename: str) -> FileResponse:
    video_path = OUTPUT_DIR / filename
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(path=video_path, filename=filename, media_type="video/mp4")
