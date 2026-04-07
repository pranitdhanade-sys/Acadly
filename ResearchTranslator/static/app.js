const form = document.getElementById('translate-form');
const statusText = document.getElementById('status');
const actionsPanel = document.getElementById('actions-panel');
const previewLink = document.getElementById('preview-link');
const translateBtn = document.getElementById('translate-btn');

let latestBlobUrl = null;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.className = isError ? 'error' : 'ok';
}

function cleanupBlobUrl() {
  if (latestBlobUrl) {
    URL.revokeObjectURL(latestBlobUrl);
    latestBlobUrl = null;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  cleanupBlobUrl();
  actionsPanel.classList.add('hidden');

  const formData = new FormData(form);
  const paper = document.getElementById('paper').files[0];
  const languageCode = document.getElementById('targetLanguage').value;

  translateBtn.disabled = true;
  setStatus('Translating PDF and rebuilding document layout...');

  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json();
      throw new Error(payload.error || 'Translation failed.');
    }

    const translatedBlob = await response.blob();
    latestBlobUrl = URL.createObjectURL(translatedBlob);

    const originalName = (paper?.name || 'paper').replace(/\.pdf$/i, '');
    const downloadedName = `${originalName}-${languageCode}-translated.pdf`;

    const anchor = document.createElement('a');
    anchor.href = latestBlobUrl;
    anchor.download = downloadedName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    previewLink.href = latestBlobUrl;
    actionsPanel.classList.remove('hidden');
    setStatus('Done. The translated PDF download has started.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    translateBtn.disabled = false;
  }
});

window.addEventListener('beforeunload', cleanupBlobUrl);
