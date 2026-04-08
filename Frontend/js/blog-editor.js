const tabs = document.querySelectorAll('.tab');
const markdownEditor = document.getElementById('markdownEditor');
const richEditor = document.getElementById('richEditor');
const latexEditor = document.getElementById('latexEditor');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const metadataPreview = document.getElementById('metadataPreview');

const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const tagsInput = document.getElementById('tags');
const slugInput = document.getElementById('slug');
const excerptInput = document.getElementById('excerpt');

const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const h2Btn = document.getElementById('h2Btn');

let activeMode = 'markdown';

function setMode(mode) {
  activeMode = mode;
  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.mode === mode));
  markdownEditor.style.display = mode === 'markdown' ? 'block' : 'none';
  richEditor.style.display = mode === 'rich' ? 'block' : 'none';
  latexEditor.style.display = mode === 'latex' ? 'block' : 'none';
}

function currentContent() {
  if (activeMode === 'rich') return richEditor.innerHTML.trim();
  if (activeMode === 'latex') return latexEditor.value.trim();
  return markdownEditor.value.trim();
}

function createSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toMarkdownFromRich(html) {
  return html
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<br\s*\/?/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function renderPreview() {
  const content = currentContent();

  if (!content) {
    preview.innerHTML = '<em>Nothing to preview yet.</em>';
    return;
  }

  if (activeMode === 'latex') {
    preview.innerHTML = `$$${content}$$`;
  } else if (activeMode === 'rich') {
    preview.innerHTML = content;
  } else {
    preview.innerHTML = marked.parse(content);
  }

  if (window.renderMathInElement) {
    window.renderMathInElement(preview, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
  }
}

function buildOutput() {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim() || 'Acadly Contributor';
  const date = new Date().toISOString().slice(0, 10);
  const slug = (slugInput.value.trim() || createSlug(title || 'blog-post'));
  const tags = tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean);
  const excerpt = excerptInput.value.trim();

  let content = currentContent();
  if (activeMode === 'rich') {
    content = toMarkdownFromRich(content);
  }
  if (activeMode === 'latex') {
    content = `$$\n${content}\n$$`;
  }

  const metadataObject = {
    title,
    author,
    date,
    slug,
    excerpt,
    tags,
    format: 'markdown',
    ext: 'md'
  };

  const metadataText = JSON.stringify(metadataObject, null, 2);
  const finalFileText = `# ${title || 'Untitled'}\n\n${content}`;

  metadataPreview.textContent = `Add this object in Frontend/blogs/metadata.json:\n\n${metadataText}`;

  return { slug, finalFileText };
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
});

previewBtn.addEventListener('click', renderPreview);

generateBtn.addEventListener('click', () => {
  buildOutput();
  renderPreview();
});

downloadBtn.addEventListener('click', () => {
  const { slug, finalFileText } = buildOutput();
  downloadFile(`${slug}.md`, finalFileText);
});

boldBtn.addEventListener('click', () => {
  if (activeMode === 'rich') document.execCommand('bold');
});

italicBtn.addEventListener('click', () => {
  if (activeMode === 'rich') document.execCommand('italic');
});

h2Btn.addEventListener('click', () => {
  if (activeMode === 'rich') document.execCommand('formatBlock', false, 'h2');
});

setMode('markdown');
metadataPreview.textContent = 'Fill in fields and click “Generate Metadata + File”.';
