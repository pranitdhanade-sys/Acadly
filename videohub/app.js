const API_BASE = "http://localhost:8002";

const statusBox = document.getElementById("status");
const languageSelect = document.getElementById("languageSelect");
const translateBtn = document.getElementById("translateBtn");
const downloadLink = document.getElementById("downloadLink");

async function loadLanguages() {
  const response = await fetch(`${API_BASE}/languages`);
  if (!response.ok) {
    throw new Error("Could not load language options.");
  }

  const data = await response.json();
  languageSelect.innerHTML = "";

  Object.entries(data.languages).forEach(([label, code]) => {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${label} (${code})`;
    languageSelect.appendChild(option);
  });
}

async function translateVideo() {
  downloadLink.style.display = "none";
  const fileInput = document.getElementById("videoFile");
  const file = fileInput.files[0];

  if (!file) {
    statusBox.textContent = "Please select a video file first.";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("target_language", languageSelect.value);

  statusBox.textContent = "Processing video. This may take a while...";

  try {
    const response = await fetch(`${API_BASE}/translate-video`, {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.detail || "Translation failed.");
    }

    statusBox.textContent = [
      payload.message,
      `Detected language: ${payload.detected_language}`,
      `Target language: ${payload.target_language}`,
      `Transcript: ${payload.transcript}`,
      `Translated: ${payload.translated_text}`,
    ].join("\n");

    downloadLink.href = `${API_BASE}${payload.download_url}`;
    downloadLink.style.display = "inline-block";
  } catch (error) {
    statusBox.textContent = `Error: ${error.message}`;
  }
}

translateBtn.addEventListener("click", translateVideo);

loadLanguages().catch((error) => {
  statusBox.textContent = `Failed to initialize page: ${error.message}`;
});
