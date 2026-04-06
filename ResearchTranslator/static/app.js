const form = document.getElementById('translate-form');
const statusText = document.getElementById('status');
const outputBox = document.getElementById('translated-output');
const resultPanel = document.getElementById('result-panel');
const resultTitle = document.getElementById('result-title');
const actionsPanel = document.getElementById('actions-panel');
const translateBtn = document.getElementById('translate-btn');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');

let currentFileName = 'translated-paper';

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = isError ? 'error' : 'ok';
}

function toggleResult(isVisible) {
  resultPanel.classList.toggle('hidden', !isVisible);
  actionsPanel.classList.toggle('hidden', !isVisible);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  translateBtn.disabled = true;
  setStatus('Translating paper... this may take a while for longer PDFs.');
  toggleResult(false);

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Unable to translate file.');
    }

    currentFileName = payload.fileName;
    resultTitle.textContent = `${payload.fileName}.pdf → ${payload.targetLanguageName}`;
    outputBox.value = payload.translatedText;
    toggleResult(true);
    setStatus('Translation complete. You can copy or download the result.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    translateBtn.disabled = false;
  }
});

downloadBtn.addEventListener('click', async () => {
  if (!outputBox.value.trim()) {
    setStatus('No translated content available to download.', true);
    return;
  }

  try {
    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: currentFileName,
        content: outputBox.value,
      }),
    });

    if (!response.ok) {
      throw new Error('Could not create download file.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${currentFileName}-translation.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setStatus('Download started.');
  } catch (error) {
    setStatus(error.message, true);
  }
});

copyBtn.addEventListener('click', async () => {
  if (!outputBox.value.trim()) {
    setStatus('No translated content available to copy.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(outputBox.value);
    setStatus('Translation copied to clipboard.');
  } catch {
    setStatus('Unable to access clipboard in this browser.', true);
  }
});

clearBtn.addEventListener('click', () => {
  form.reset();
  outputBox.value = '';
  toggleResult(false);
  setStatus('Cleared. Upload another paper to translate.');
});
