const statusEl = document.getElementById("status");
const resultCountEl = document.getElementById("resultCount");
const pdfGridEl = document.getElementById("pdfGrid");
const refreshButton = document.getElementById("refreshButton");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortBy = document.getElementById("sortBy");
const cardTemplate = document.getElementById("pdfCardTemplate");

const totalCountEl = document.getElementById("totalCount");
const categoryCountEl = document.getElementById("categoryCount");
const lastUpdatedEl = document.getElementById("lastUpdated");

let allPdfs = [];

function setStatus(message, tone = "info") {
  statusEl.textContent = message;
  statusEl.classList.remove("status-error", "status-success");

  if (tone === "error") {
    statusEl.classList.add("status-error");
  } else if (tone === "success") {
    statusEl.classList.add("status-success");
  }
}

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function getPdfUrl(pdf) {
  return pdf.filePath || pdf.viewUrl || "#";
}

function buildCategoryOptions(pdfs) {
  const categories = [...new Set(pdfs.map((pdf) => (pdf.category || "General").trim()))].sort((a, b) =>
    a.localeCompare(b)
  );

  const options = ["<option value=\"all\">All categories</option>"];
  categories.forEach((category) => {
    options.push(`<option value="${category}">${category}</option>`);
  });

  categoryFilter.innerHTML = options.join("");
}

function updateStats(pdfs) {
  const categories = new Set(pdfs.map((pdf) => pdf.category || "General"));
  totalCountEl.textContent = String(pdfs.length);
  categoryCountEl.textContent = String(categories.size);
  lastUpdatedEl.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function applyFiltersAndSort() {
  const search = normalizeText(searchInput.value);
  const selectedCategory = categoryFilter.value;
  const sortMode = sortBy.value;

  const filtered = allPdfs.filter((pdf) => {
    const category = pdf.category || "General";
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;

    if (!matchesCategory) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [pdf.title, pdf.fileName, category, pdf.description].map(normalizeText).join(" ");
    return haystack.includes(search);
  });

  filtered.sort((a, b) => {
    if (sortMode === "title-desc") return String(b.title || "").localeCompare(String(a.title || ""));
    if (sortMode === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortMode === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    return String(a.title || "").localeCompare(String(b.title || ""));
  });

  renderPdfs(filtered);
}

function renderPdfs(pdfs) {
  pdfGridEl.innerHTML = "";

  if (!pdfs.length) {
    const emptyState = document.createElement("article");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <h3>No PDFs found</h3>
      <p>Try changing your filters or upload new files from the upload page.</p>
      <a href="/upload" class="button button-primary">Go to Upload</a>
    `;
    pdfGridEl.appendChild(emptyState);
    resultCountEl.textContent = "0 results";
    return;
  }

  const fragment = document.createDocumentFragment();

  pdfs.forEach((pdf, index) => {
    const cardNode = cardTemplate.content.firstElementChild.cloneNode(true);
    const title = cardNode.querySelector(".pdf-title");
    const categoryChip = cardNode.querySelector(".category-chip");
    const fileName = cardNode.querySelector(".pdf-file");
    const openLink = cardNode.querySelector(".open-link");
    const copyButton = cardNode.querySelector(".copy-link");

    const pdfTitle = pdf.title || pdf.fileName || "Untitled PDF";
    const pdfCategory = pdf.category || "General";
    const pdfUrl = getPdfUrl(pdf);

    title.textContent = pdfTitle;
    categoryChip.textContent = pdfCategory;
    fileName.textContent = pdf.fileName || "Stored in MongoDB";

    openLink.href = pdfUrl;
    copyButton.dataset.url = new URL(pdfUrl, window.location.origin).toString();

    cardNode.style.animationDelay = `${index * 50}ms`;

    fragment.appendChild(cardNode);
  });

  pdfGridEl.appendChild(fragment);
  resultCountEl.textContent = `${pdfs.length} result${pdfs.length === 1 ? "" : "s"}`;
}

async function loadLibrary(refresh = false) {
  try {
    setStatus(refresh ? "Refreshing PDFs from MongoDB..." : "Loading PDF library...");

    const endpoint = refresh ? "/api/pdfs/refresh" : "/api/pdfs";
    const response = await fetch(endpoint, {
      method: refresh ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load PDF library");
    }

    allPdfs = Array.isArray(data) ? data : data.pdfs || [];

    buildCategoryOptions(allPdfs);
    updateStats(allPdfs);
    applyFiltersAndSort();
    setStatus(`Loaded ${allPdfs.length} PDF(s) from MongoDB.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

pdfGridEl.addEventListener("click", async (event) => {
  const copyButton = event.target.closest(".copy-link");
  if (!copyButton) {
    return;
  }

  const originalText = copyButton.textContent;

  try {
    await navigator.clipboard.writeText(copyButton.dataset.url || "");
    copyButton.textContent = "Copied!";
    setStatus("Shareable PDF link copied to clipboard.", "success");
  } catch (err) {
    setStatus("Could not copy link. Please copy it manually from Open.", "error");
  }

  setTimeout(() => {
    copyButton.textContent = originalText;
  }, 1200);
});

refreshButton.addEventListener("click", () => loadLibrary(true));
searchInput.addEventListener("input", applyFiltersAndSort);
categoryFilter.addEventListener("change", applyFiltersAndSort);
sortBy.addEventListener("change", applyFiltersAndSort);

loadLibrary();
