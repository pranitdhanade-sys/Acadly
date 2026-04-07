# Research Paper Translator (Python + JS UI)

This app lets users upload a **PDF research paper** and receive a **translated PDF** while keeping the original layout (images/tables/graphics) as intact as possible.

## Features
- Upload PDF paper
- Translate into a selected target language
- Replace original text in the PDF with translated text
- Auto-download translated `.pdf`
- Open translated PDF preview in browser

## Tech stack
- Python: Flask, PyMuPDF, deep-translator
- Frontend: HTML/CSS + vanilla JavaScript

## Run locally

```bash
pip install -r requirements.txt
python ResearchTranslator/app.py
```

Then open: `http://localhost:5001`

## Notes
- Translation uses `deep-translator` with Google Translate backend.
- The app attempts to preserve the exact structure of the original PDF by redacting/reinserting text spans.
- Scanned/image-only text cannot be translated without OCR.
