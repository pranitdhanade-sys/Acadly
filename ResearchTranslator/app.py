from __future__ import annotations

from io import BytesIO
from pathlib import Path

import fitz  # PyMuPDF
from deep_translator import GoogleTranslator
from flask import Flask, jsonify, render_template, request, send_file

app = Flask(__name__)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
CHUNK_SIZE = 3500
MIN_FONT_SIZE = 5

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


def translate_text(text: str, target_language: str, cache: dict[str, str]) -> str:
    clean_text = text.strip()
    if not clean_text:
        return text

    if clean_text in cache:
        return cache[clean_text]

    chunks = chunk_text(clean_text)
    translated_parts: list[str] = []

    translator = GoogleTranslator(source="auto", target=target_language)
    for chunk in chunks:
        translated_parts.append(translator.translate(chunk))

    translated = "\n".join(translated_parts)
    cache[clean_text] = translated
    return translated


def insert_translated_text(page: fitz.Page, bbox: fitz.Rect, text: str, fontsize: float, color: int) -> None:
    current_size = max(fontsize, MIN_FONT_SIZE)
    while current_size >= MIN_FONT_SIZE:
        result = page.insert_textbox(
            bbox,
            text,
            fontsize=current_size,
            fontname="helv",
            color=fitz.sRGB_to_pdf(color),
            align=fitz.TEXT_ALIGN_LEFT,
        )
        if result >= 0:
            return
        current_size -= 0.5

    page.insert_textbox(
        bbox,
        text,
        fontsize=MIN_FONT_SIZE,
        fontname="helv",
        color=fitz.sRGB_to_pdf(color),
        align=fitz.TEXT_ALIGN_LEFT,
    )


def translate_pdf(pdf_bytes: bytes, target_language: str) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    translation_cache: dict[str, str] = {}

    for page in doc:
        blocks = page.get_text("dict").get("blocks", [])
        replacements: list[tuple[fitz.Rect, str, float, int]] = []

        for block in blocks:
            if block.get("type") != 0:
                continue

            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    original_text = span.get("text", "")
                    if not original_text.strip():
                        continue

                    translated = translate_text(original_text, target_language, translation_cache)
                    bbox = fitz.Rect(span.get("bbox"))
                    fontsize = float(span.get("size", 10))
                    color = int(span.get("color", 0))
                    replacements.append((bbox, translated, fontsize, color))

        for bbox, _, _, _ in replacements:
            page.add_redact_annot(bbox, fill=(1, 1, 1))

        if replacements:
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

        for bbox, translated, fontsize, color in replacements:
            insert_translated_text(page, bbox, translated, fontsize, color)

    output = doc.tobytes(garbage=4, deflate=True)
    doc.close()
    return output


@app.get("/")
def index() -> str:
    return render_template("index.html", languages=SUPPORTED_LANGUAGES)


@app.post("/api/translate")
def translate_pdf_route():
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
        translated_pdf = translate_pdf(pdf_bytes, target_language)
    except Exception as exc:  # pragma: no cover - defensive runtime path
        return jsonify({"error": f"Translation failed: {exc}"}), 500

    safe_name = Path(pdf_file.filename).stem
    output_name = f"{safe_name}-{target_language}-translated.pdf"

    return send_file(
        BytesIO(translated_pdf),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=output_name,
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
