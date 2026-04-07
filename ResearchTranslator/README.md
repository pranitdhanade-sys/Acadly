# Research Paper Translator (Python + JS UI)

This mini app lets users upload a **PDF research paper**, translate the extracted text into another language, and then copy/download the translated output from the browser.

## Features
- Upload PDF paper
- Translate into a selected target language
- Display translated output in the browser (rendered via JavaScript)
- Copy translation to clipboard
- Download translation as `.txt`

## Tech stack
- Python: Flask, pypdf, deep-translator
- Frontend: HTML/CSS + vanilla JavaScript

## Run locally

```bash
pip install -r requirements.txt
python ResearchTranslator/app.py
```

Then open: `http://localhost:5001`

## Notes
- Translation uses `deep-translator` with Google Translate backend.
- PDFs with scanned images (no embedded text) cannot be translated until OCR is added.
