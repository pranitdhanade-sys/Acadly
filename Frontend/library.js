const statusEl = document.getElementById("status");
const pdfGridEl = document.getElementById("pdfGrid");
const refreshButton = document.getElementById("refreshButton");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#111827";
}

function renderPdfs(pdfs) {
  pdfGridEl.innerHTML = "";

  if (!pdfs.length) {
    setStatus("No PDFs found. Add PDF files into Frontend/pdfs and click refresh.");
    return;
  }

  const fragment = document.createDocumentFragment();

  pdfs.forEach((pdf) => {
    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("h2");
    title.textContent = pdf.title || pdf.fileName;

    const preview = document.createElement("iframe");
    preview.className = "preview";
    preview.src = pdf.filePath;
    preview.title = `${pdf.title || pdf.fileName} preview`;

    const openLink = document.createElement("a");
    openLink.className = "open-link";
    openLink.href = pdf.filePath;
    openLink.target = "_blank";
    openLink.rel = "noopener noreferrer";
    openLink.textContent = "Open PDF";

    card.append(title, preview, openLink);
    fragment.appendChild(card);
  });

  pdfGridEl.appendChild(fragment);
  setStatus(`Loaded ${pdfs.length} PDF(s) from MongoDB.`);
}

async function loadLibrary(refresh = false) {
  try {
    setStatus(refresh ? "Refreshing PDF list..." : "Loading PDF library...");

    const response = await fetch(refresh ? "/api/pdfs/refresh" : "/api/pdfs", {
      method: refresh ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load PDF library");
    }

    renderPdfs(data.pdfs || []);
  } catch (error) {
    setStatus(error.message, true);
  }
}

refreshButton.addEventListener("click", () => loadLibrary(true));
loadLibrary();
