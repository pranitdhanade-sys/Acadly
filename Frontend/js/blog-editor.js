const tabs = document.querySelectorAll('.tab');
const markdownEditor = document.getElementById('markdownEditor');
const richEditor = document.getElementById('richEditor');
const latexEditor = document.getElementById('latexEditor');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const previewBtn = document.getElementById('previewBtn');
const metadataPreview = document.getElementById('metadataPreview');
const metadataText = metadataPreview?.parentElement?.querySelector('#metadataText') || document.createElement('span');

const titleInput = document.getElementById('title');
const authorInput = document.getElementById('author');
const tagsInput = document.getElementById('tags');
const slugInput = document.getElementById('slug');
const excerptInput = document.getElementById('excerpt');

const boldBtn = document.getElementById('boldBtn');
const italicBtn = document.getElementById('italicBtn');
const h2Btn = document.getElementById('h2Btn');

let activeMode = 'markdown';
const BLOG_METADATA_KEY = 'acadly-blog-metadata';
const BLOG_DRAFT_KEY = 'acadly-blog-draft';

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
    .replace(/-+/g, '-')
    .slice(0, 50);
}

function toMarkdownFromRich(html) {
  return html
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<code class="tok-code">(.*?)<\/code>/gi, '`$1`')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function renderPreview() {
  const content = currentContent();

  if (!content) {
    preview.innerHTML = '<p class="text-slate-400 italic">Nothing to preview yet. Start writing below...</p>';
    return;
  }

  try {
    if (activeMode === 'latex') {
      preview.innerHTML = `<div class="text-center p-4">$$${content}$$</div>`;
    } else if (activeMode === 'rich') {
      preview.innerHTML = content;
    } else {
      preview.innerHTML = marked.parse(content);
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(preview, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ]
      });
    }
  } catch (e) {
    preview.innerHTML = `<p class="text-red-400">Error rendering preview: ${e.message}</p>`;
  }
}

function saveDraft() {
  const draft = {
    title: titleInput.value,
    author: authorInput.value,
    tags: tagsInput.value,
    slug: slugInput.value,
    excerpt: excerptInput.value,
    content: currentContent(),
    mode: activeMode,
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(BLOG_DRAFT_KEY) || '{}');
    if (draft.title) {
      titleInput.value = draft.title;
      authorInput.value = draft.author || '';
      tagsInput.value = draft.tags || '';
      slugInput.value = draft.slug || '';
      excerptInput.value = draft.excerpt || '';
      
      if (draft.mode === 'markdown') markdownEditor.value = draft.content || '';
      else if (draft.mode === 'rich') richEditor.innerHTML = draft.content || '';
      else if (draft.mode === 'latex') latexEditor.value = draft.content || '';
      
      setMode(draft.mode || 'markdown');
      renderPreview();
    }
  } catch {}
}

function buildOutput() {
  const title = titleInput.value.trim() || 'Untitled Blog';
  const author = authorInput.value.trim() || 'Acadly Contributor';
  const date = new Date().toISOString().slice(0, 10);
  const slug = (slugInput.value.trim() || createSlug(title)).toLowerCase();
  const tags = tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean);
  const excerpt = excerptInput.value.trim();

  let content = currentContent();
  if (activeMode === 'rich') {
    content = toMarkdownFromRich(content);
  }
  if (activeMode === 'latex') {
    content = `$$\n${content}\n$$`;
  }

  const metadata = {
    title,
    author,
    date,
    slug,
    excerpt,
    tags,
    format: 'markdown',
    ext: 'md'
  };

  const finalFileText = `---\ntitle: ${title}\nauthor: ${author}\ndate: ${date}\ntags: ${tags.join(', ')}\n---\n\n# ${title}\n\n${content}`;

  // Show success message
  if (metadataPreview) {
    metadataPreview.classList.remove('hidden');
    if (metadataText) metadataText.textContent = `✓ Blog generated! Filename: "${slug}.md"`;
  }

  return { slug, finalFileText, metadata };
}

function downloadFile(filename, text) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  // Clear draft after download
  setTimeout(() => {
    try {
      localStorage.removeItem(BLOG_DRAFT_KEY);
    } catch {}
  }, 1000);
}

// Event Listeners
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setMode(tab.dataset.mode);
    setTimeout(() => renderPreview(), 100);
  });
});

previewBtn.addEventListener('click', () => {
  renderPreview();
  alert('Preview updated!');
});

generateBtn.addEventListener('click', () => {
  buildOutput();
  renderPreview();
});

downloadBtn.addEventListener('click', () => {
  const { slug, finalFileText } = buildOutput();
  downloadFile(`${slug}.md`, finalFileText);
  alert(`✓ Blog downloaded as ${slug}.md\n\nNext step: Add this entry to Frontend/blogs/metadata.json`);
});

h2Btn.addEventListener('click', () => {
  if (activeMode === 'rich') {
    document.execCommand('formatBlock', false, '<h2>');
  } else if (activeMode === 'markdown') {
    const start = markdownEditor.selectionStart;
    const end = markdownEditor.selectionEnd;
    const selected = markdownEditor.value.substring(start, end);
    markdownEditor.value = markdownEditor.value.substring(0, start) + 
                           `## ${selected || 'Heading'}` + 
                           markdownEditor.value.substring(end);
    renderPreview();
  }
});

boldBtn.addEventListener('click', () => {
  if (activeMode === 'rich') {
    document.execCommand('bold');
  } else if (activeMode === 'markdown') {
    const start = markdownEditor.selectionStart;
    const end = markdownEditor.selectionEnd;
    const selected = markdownEditor.value.substring(start, end);
    markdownEditor.value = markdownEditor.value.substring(0, start) + 
                           `**${selected || 'bold'}**` + 
                           markdownEditor.value.substring(end);
    renderPreview();
  }
});

italicBtn.addEventListener('click', () => {
  if (activeMode === 'rich') {
    document.execCommand('italic');
  } else if (activeMode === 'markdown') {
    const start = markdownEditor.selectionStart;
    const end = markdownEditor.selectionEnd;
    const selected = markdownEditor.value.substring(start, end);
    markdownEditor.value = markdownEditor.value.substring(0, start) + 
                           `*${selected || 'italic'}*` + 
                           markdownEditor.value.substring(end);
    renderPreview();
  }
});

// Auto-save draft every 30 seconds
setInterval(saveDraft, 30000);

// Save draft on input
[markdownEditor, richEditor, latexEditor, titleInput, authorInput, tagsInput, slugInput, excerptInput].forEach(el => {
  if (el) el.addEventListener('input', saveDraft);
});

// Auto-update slug when title changes
titleInput.addEventListener('blur', () => {
  if (!slugInput.value) {
    slugInput.value = createSlug(titleInput.value);
  }
});

// Live preview on input
markdownEditor.addEventListener('input', renderPreview);
richEditor.addEventListener('input', renderPreview);
latexEditor.addEventListener('input', renderPreview);

// Initialize
loadDraft();
setTimeout(() => renderPreview(), 500);


h2Btn.addEventListener('click', () => {
  if (activeMode === 'rich') document.execCommand('formatBlock', false, 'h2');
});

setMode('markdown');
metadataPreview.textContent = 'Fill in fields and click “Generate Metadata + File”.';
