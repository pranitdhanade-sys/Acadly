const form = document.getElementById('translate-form');
const statusText = document.getElementById('status');
const actionsPanel = document.getElementById('actions-panel');
const latexPanel = document.getElementById('latex-panel');
const previewPanel = document.getElementById('preview-panel');
const latexOutput = document.getElementById('latex-output');
const pdfPreview = document.getElementById('pdf-preview');
const translateBtn = document.getElementById('translate-btn');
const downloadPdfBtn = document.getElementById('download-pdf-btn');
const downloadTexBtn = document.getElementById('download-tex-btn');
const copyTexBtn = document.getElementById('copy-tex-btn');

let latestPdfBlob = null;
let latestLatex = '';
let latestFileName = 'translated-paper';

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = isError ? 'error' : 'ok';
}

function b64ToBlob(base64Data, mimeType) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  actionsPanel.classList.add('hidden');
  latexPanel.classList.add('hidden');
  previewPanel.classList.add('hidden');

  const formData = new FormData(form);
  translateBtn.disabled = true;
  setStatus('Detecting elements, translating text, generating LaTeX, and compiling PDF...');

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Generation failed.');
    }

    latestFileName = payload.fileName || 'translated-paper';
    latestLatex = payload.latexCode || '';
    latestPdfBlob = b64ToBlob(payload.pdfBase64, 'application/pdf');

    latexOutput.value = latestLatex;
    const previewUrl = URL.createObjectURL(latestPdfBlob);
    pdfPreview.src = previewUrl;

    actionsPanel.classList.remove('hidden');
    latexPanel.classList.remove('hidden');
    previewPanel.classList.remove('hidden');
    setStatus('Done. LaTeX and generated PDF are ready.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    translateBtn.disabled = false;
  }
});

downloadPdfBtn.addEventListener('click', () => {
  if (!latestPdfBlob) {
    setStatus('No generated PDF available yet.', true);
    return;
  }
  downloadBlob(latestPdfBlob, `${latestFileName}-latex-output.pdf`);
});

downloadTexBtn.addEventListener('click', () => {
  if (!latestLatex) {
    setStatus('No LaTeX code available yet.', true);
    return;
  }
  const texBlob = new Blob([latestLatex], { type: 'text/plain;charset=utf-8' });
  downloadBlob(texBlob, `${latestFileName}.tex`);
});

copyTexBtn.addEventListener('click', async () => {
  if (!latestLatex) {
    setStatus('No LaTeX code available yet.', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(latestLatex);
    setStatus('LaTeX copied to clipboard.');
  } catch {
    setStatus('Clipboard access failed.', true);
  }
});
