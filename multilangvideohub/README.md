# multilangvideohub

FastAPI backend for multilingual video dubbing.

## Run

```bash
cd multilangvideohub
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8002
```

## Endpoints

- `GET /health`
- `GET /languages` (returns supported language choices)
- `POST /translate-video` (`file` + `target_language`)
- `GET /download/{filename}`

Requires `ffmpeg` installed on host.
