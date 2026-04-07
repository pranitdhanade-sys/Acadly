from __future__ import annotations

from io import BytesIO
from pathlib import Path

from deep_translator import GoogleTranslator
from flask import Flask, jsonify, render_template, request, send_file
from pypdf import PdfReader

app = Flask(__name__)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
CHUNK_SIZE = 4000

SUPPORTED_LANGUAGES = {
    "ar": "Arabic",
    "de": "German",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "hi": "Hindi",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "pt": "Portuguese",
    "ru": "Russian",
    "zh-CN": "Chinese (Simplified)",
}


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE) -> list[str]:
    words = text.split()
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_size = 0

    for word in words:
        projected_size = current_size + len(word) + 1
        if projected_size > chunk_size and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_size = len(word)
        else:
            current_chunk.append(word)
            current_size = projected_size

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks


def extract_pdf_text(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    extracted_pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(extracted_pages).strip()


def translate_text(text: str, target_language: str) -> str:
    chunks = chunk_text(text)
    translated_parts: list[str] = []

    for chunk in chunks:
        translated_parts.append(GoogleTranslator(source="auto", target=target_language).translate(chunk))

    return "\n\n".join(translated_parts)


@app.get("/")
def index() -> str:
    return render_template("index.html", languages=SUPPORTED_LANGUAGES)


@app.get("/api/languages")
def languages() -> tuple[dict[str, dict[str, str]], int]:
    return jsonify({"languages": SUPPORTED_LANGUAGES}), 200


@app.post("/api/translate")
def translate_pdf() -> tuple[dict[str, str], int]:
    pdf_file = request.files.get("paper")
    target_language = request.form.get("targetLanguage", "").strip()

    if not pdf_file or not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a valid PDF file."}), 400

    if target_language not in SUPPORTED_LANGUAGES:
        return jsonify({"error": "Unsupported target language selected."}), 400

    pdf_bytes = pdf_file.read()
    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        return jsonify({"error": "PDF is too large. Maximum allowed size is 25MB."}), 400

    try:
        original_text = extract_pdf_text(pdf_bytes)
    except Exception as exc:  # pragma: no cover - defensive runtime path
        return jsonify({"error": f"Unable to read PDF: {exc}"}), 400

    if not original_text:
        return jsonify({"error": "No readable text found in PDF."}), 400

    try:
        translated_text = translate_text(original_text, target_language)
    except Exception as exc:  # pragma: no cover - network/runtime path
        return jsonify({"error": f"Translation failed: {exc}"}), 500

    return (
        jsonify(
            {
                "fileName": Path(pdf_file.filename).stem,
                "targetLanguage": target_language,
                "targetLanguageName": SUPPORTED_LANGUAGES[target_language],
                "originalText": original_text,
                "translatedText": translated_text,
            }
        ),
        200,
    )


@app.post("/api/download")
def download_translation():
    payload = request.get_json(silent=True) or {}
    file_name = payload.get("fileName", "translated-paper")
    content = payload.get("content", "")

    safe_name = "".join(ch for ch in file_name if ch.isalnum() or ch in ("-", "_")) or "translated-paper"
    buffer = BytesIO(content.encode("utf-8"))
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="text/plain",
        as_attachment=True,
        download_name=f"{safe_name}-translation.txt",
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
