# Research Paper Translator to LaTeX PDF

This app uploads a research paper PDF, detects document elements (title, headings, list items, paragraphs), translates text, converts the structure into LaTeX, and shows the compiled PDF output.

## Features
- Upload PDF research paper
- Detect structural elements with heuristics (title/heading/list/paragraph)
- Translate extracted text into a selected language
- Generate LaTeX source code from detected elements
- Compile and preview PDF generated from LaTeX
- Download generated `.pdf` and `.tex`

## Tech stack
- Python: Flask, PyMuPDF, deep-translator
- LaTeX compilation: `pdflatex` binary on server
- Frontend: HTML/CSS + vanilla JavaScript

## Run locally

```bash
pip install -r requirements.txt
python ResearchTranslator/app.py
```

Open `http://localhost:5001`

## Notes
- You must have `pdflatex` installed and available in PATH.
- Structure detection is heuristic-based and may need refinement for complex papers.
- Image-only scanned PDFs require OCR before meaningful conversion.
