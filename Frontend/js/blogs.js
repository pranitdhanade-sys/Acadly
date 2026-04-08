const blogList = document.getElementById('blogList');
const searchInput = document.getElementById('search');
const statusEl = document.getElementById('status');
const modal = document.getElementById('blogModal');
const closeModal = document.getElementById('closeModal');
const blogTitle = document.getElementById('blogTitle');
const blogMeta = document.getElementById('blogMeta');
const blogContent = document.getElementById('blogContent');

let blogs = [];

function normalize(value) {
  return String(value || '').toLowerCase();
}

function filterBlogs(query) {
  const q = normalize(query);
  if (!q) return blogs;

  return blogs.filter((blog) => {
    return [
      blog.title,
      blog.author,
      blog.excerpt,
      (blog.tags || []).join(' ')
    ].some((field) => normalize(field).includes(q));
  });
}

function renderCards(list) {
  if (!list.length) {
    blogList.innerHTML = '';
    statusEl.textContent = 'No blogs matched your search.';
    return;
  }

  statusEl.textContent = `${list.length} blog(s) found`;

  blogList.innerHTML = list.map((blog) => {
    const tags = (blog.tags || []).map((tag) => `<span class="tag">${tag}</span>`).join('');
    return `
      <article class="card">
        <h3>${blog.title}</h3>
        <div class="meta">
          <span>By ${blog.author || 'Unknown'}</span>
          <span>${blog.date || 'No date'}</span>
          <span>${blog.format || 'markdown'}</span>
        </div>
        <p class="excerpt">${blog.excerpt || ''}</p>
        <div class="tags">${tags}</div>
        <button class="read-btn" data-slug="${blog.slug}">Read Blog</button>
      </article>
    `;
  }).join('');
}

async function openBlog(slug) {
  const blog = blogs.find((entry) => entry.slug === slug);
  if (!blog) return;

  try {
    const response = await fetch(`/blogs/${slug}.${blog.ext || 'md'}`);
    if (!response.ok) throw new Error('Failed to load blog file');

    const content = await response.text();
    blogTitle.textContent = blog.title;
    blogMeta.textContent = `By ${blog.author || 'Unknown'} • ${blog.date || 'No date'} • ${blog.format || 'markdown'}`;

    if (blog.format === 'html') {
      blogContent.innerHTML = content;
    } else {
      blogContent.innerHTML = marked.parse(content);
      if (window.renderMathInElement) {
        window.renderMathInElement(blogContent, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ]
        });
      }
    }

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  } catch (error) {
    statusEl.textContent = `Error loading blog: ${error.message}`;
  }
}

function bindEvents() {
  searchInput.addEventListener('input', (event) => {
    renderCards(filterBlogs(event.target.value));
  });

  blogList.addEventListener('click', (event) => {
    const readButton = event.target.closest('[data-slug]');
    if (!readButton) return;
    openBlog(readButton.dataset.slug);
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    blogContent.innerHTML = '';
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal.click();
  });
}

async function loadBlogs() {
  statusEl.textContent = 'Loading blogs...';
  try {
    const response = await fetch('/blogs/metadata.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    blogs = await response.json();
    renderCards(blogs);
  } catch (error) {
    statusEl.textContent = `Unable to load blog metadata: ${error.message}`;
  }
}

bindEvents();
loadBlogs();
