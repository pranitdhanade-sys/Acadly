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

app = FastAPI(title="Multi Language Video Hub", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LANGUAGE_OPTIONS = {
    "English": "en",
    "Hindi": "hi",
    "Spanish": "es",
    "French": "fr",
    "German": "de",
    "Italian": "it",
    "Portuguese": "pt",
    "Japanese": "ja",
    "Korean": "ko",
    "Arabic": "ar",
    "Russian": "ru",
    "Chinese": "zh-CN",
}

MODEL_SIZE = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
OUTPUT_DIR = Path(os.getenv("MULTILANG_VIDEO_OUTPUT_DIR", "multilangvideohub/outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _model


def run_ffmpeg(cmd: list[str]) -> None:
    process = subprocess.run(cmd, capture_output=True, text=True)
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "ffmpeg command failed")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/languages")
def languages() -> dict[str, dict[str, str]]:
    return {"languages": LANGUAGE_OPTIONS}


@app.post("/translate-video")
async def translate_video(
    file: UploadFile = File(...),
    target_language: str = Form(...),
) -> JSONResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please upload a valid video file name.")

    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video.")

    if target_language not in LANGUAGE_OPTIONS.values():
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported target language '{target_language}'. Use /languages for allowed codes.",
        )

    job_id = uuid.uuid4().hex
    temp_dir = Path(tempfile.mkdtemp(prefix=f"multilang_{job_id}_"))
    uploaded_video = temp_dir / file.filename
    source_audio = temp_dir / "source.wav"
    dubbed_audio = temp_dir / "dubbed.mp3"
    final_video = OUTPUT_DIR / f"dubbed_{job_id}.mp4"

    try:
        with uploaded_video.open("wb") as output:
            shutil.copyfileobj(file.file, output)

        run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(uploaded_video),
                "-vn",
                "-acodec",
                "pcm_s16le",
                "-ar",
                "16000",
                "-ac",
                "1",
                str(source_audio),
            ]
        )

        segments, info = get_model().transcribe(str(source_audio), beam_size=5)
        transcript = " ".join(segment.text.strip() for segment in segments).strip()
        if not transcript:
            raise RuntimeError("No speech detected in video.")

        translated_text = GoogleTranslator(source="auto", target=target_language).translate(transcript)
        gTTS(text=translated_text, lang=target_language).save(str(dubbed_audio))

        run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(uploaded_video),
                "-i",
                str(dubbed_audio),
                "-map",
                "0:v:0",
                "-map",
                "1:a:0",
                "-c:v",
                "copy",
                "-c:a",
                "aac",
                "-shortest",
                str(final_video),
            ]
        )

        return JSONResponse(
            {
                "message": "Video translated and dubbed successfully.",
                "job_id": job_id,
                "detected_language": info.language,
                "target_language": target_language,
                "transcript": transcript,
                "translated_text": translated_text,
                "download_url": f"/download/{final_video.name}",
            }
        )
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    except Exception as error:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Unexpected error: {error}") from error
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)
        await file.close()


@app.get("/download/{filename}")
def download(filename: str) -> FileResponse:
    output_video = OUTPUT_DIR / filename
    if not output_video.exists():
        raise HTTPException(status_code=404, detail="Translated video not found.")
    return FileResponse(path=output_video, media_type="video/mp4", filename=filename)
