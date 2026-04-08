# AI Backend - Video Language Translator (FastAPI)

This service allows a user to upload a video and automatically generate a dubbed version in another language.

## Features

- Upload a video via `POST /translate-video`
- Speech-to-text with `faster-whisper`
- Text translation with `deep-translator` (Google Translate)
- Text-to-speech with `gTTS`
- Returns a downloadable dubbed video file

## Folder Structure

```text
AI Backend/
├── main.py
├── requirements.txt
└── outputs/           # Generated dubbed videos
```

## Prerequisites

- Python 3.10+
- `ffmpeg` installed and available in PATH

## Setup

```bash
cd "AI Backend"
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run API

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## API Usage

### Health Check

```bash
curl http://localhost:8001/health
```

### Translate + Dub Video

```bash
curl -X POST "http://localhost:8001/translate-video" \
  -F "file=@/absolute/path/to/input.mp4" \
  -F "target_language=hi"
```

Example response:

```json
{
  "message": "Video dubbed successfully.",
  "job_id": "...",
  "detected_language": "en",
  "target_language": "hi",
  "transcript": "Hello everyone...",
  "translated_text": "नमस्ते सभी...",
  "download_url": "/download/dubbed_<job_id>.mp4"
}
```

Then download with:

```bash
curl -O "http://localhost:8001/download/dubbed_<job_id>.mp4"
```

## Supported Languages

You can pass language names (`hindi`, `spanish`, etc.) or language codes (`hi`, `es`, `fr`, ...). The service includes a built-in map for common language names and otherwise uses the provided value as a code.

## Notes

- First request may be slower because Whisper model loads lazily.
- This implementation dubs the full translated transcript as one generated voice track.
- For production, consider per-segment timing alignment and speaker diarization.
