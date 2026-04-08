from __future__ import annotations

import base64
import re
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF
from deep_translator import GoogleTranslator
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024
CHUNK_SIZE = 3000

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

BULLET_PATTERN = re.compile(r"^\s*(?:[-*•]|\d+[\.)])\s+")


@dataclass
class DocElement:
    kind: str
    text: str


def escape_latex(text: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


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
    clean = text.strip()
    if not clean:
        return text

    if clean in cache:
        return cache[clean]

    translator = GoogleTranslator(source="auto", target=target_language)
    translated_chunks = [translator.translate(part) for part in chunk_text(clean)]
    translated = "\n".join(translated_chunks)
    cache[clean] = translated
    return translated


def detect_elements(pdf_bytes: bytes, target_language: str) -> list[DocElement]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    lines: list[tuple[int, float, str]] = []

    for page_number, page in enumerate(doc, start=1):
        blocks = page.get_text("dict").get("blocks", [])
        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                spans = line.get("spans", [])
                text = "".join(span.get("text", "") for span in spans).strip()
                if not text:
                    continue
                size = max((float(span.get("size", 10)) for span in spans), default=10.0)
                lines.append((page_number, size, text))

    doc.close()

    if not lines:
        return []

    body_size = sorted(size for _, size, _ in lines)[len(lines) // 2]
    largest_line = max(lines, key=lambda item: item[1])
    title_text = largest_line[2]

    translation_cache: dict[str, str] = {}
    elements: list[DocElement] = []
    added_title = False

    for page_number, size, text in lines:
        translated = translate_text(text, target_language, translation_cache)
        stripped = translated.strip()

        if not added_title and page_number == 1 and text == title_text:
            elements.append(DocElement("title", stripped))
            added_title = True
            continue

        if BULLET_PATTERN.match(text):
            bullet_text = BULLET_PATTERN.sub("", stripped)
            elements.append(DocElement("list_item", bullet_text))
        elif size >= body_size + 2 and len(stripped) <= 120:
            elements.append(DocElement("heading", stripped))
        else:
            elements.append(DocElement("paragraph", stripped))

    return elements


def elements_to_latex(elements: list[DocElement]) -> str:
    title = "Translated Research Paper"
    content: list[str] = []
    in_list = False

    for element in elements:
        safe_text = escape_latex(element.text)

        if element.kind == "title":
            title = safe_text
            continue

        if element.kind == "list_item":
            if not in_list:
                content.append(r"\begin{itemize}")
                in_list = True
            content.append(rf"\item {safe_text}")
            continue

        if in_list:
            content.append(r"\end{itemize}")
            in_list = False

        if element.kind == "heading":
            content.append(rf"\section*{{{safe_text}}}")
        else:
            content.append(safe_text + "\n")

    if in_list:
        content.append(r"\end{itemize}")

    body = "\n".join(content)
    return f"""\\documentclass[11pt]{{article}}
\\usepackage[utf8]{{inputenc}}
\\usepackage[T1]{{fontenc}}
\\usepackage{{lmodern}}
\\usepackage[margin=1in]{{geometry}}
\\usepackage{{enumitem}}
\\setlist[itemize]{{leftmargin=1.5em}}
\\title{{{title}}}
\\date{{}}
\\begin{{document}}
\\maketitle
{body}
\\end{{document}}
"""


def latex_to_pdf_bytes(latex_source: str) -> bytes:
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_path = Path(temp_dir) / "translated.tex"
        pdf_path = Path(temp_dir) / "translated.pdf"
        tex_path.write_text(latex_source, encoding="utf-8")

        process = subprocess.run(
            [
                "pdflatex",
                "-interaction=nonstopmode",
                "-halt-on-error",
                tex_path.name,
            ],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )

        if process.returncode != 0 or not pdf_path.exists():
            err = (process.stderr or process.stdout).strip()
            raise RuntimeError(err or "LaTeX compilation failed")

        return pdf_path.read_bytes()


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
        elements = detect_elements(pdf_bytes, target_language)
        if not elements:
            return jsonify({"error": "No readable text elements found in PDF."}), 400

        latex_code = elements_to_latex(elements)
        pdf_output = latex_to_pdf_bytes(latex_code)
    except FileNotFoundError:
        return jsonify({"error": "pdflatex is not installed on the server."}), 500
    except Exception as exc:  # pragma: no cover
        return jsonify({"error": f"Processing failed: {exc}"}), 500

    return (
        jsonify(
            {
                "fileName": Path(pdf_file.filename).stem,
                "latexCode": latex_code,
                "pdfBase64": base64.b64encode(pdf_output).decode("ascii"),
            }
        ),
        200,
    )


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)
