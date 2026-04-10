const blogList = document.getElementById('blogList');
const searchInput = document.getElementById('search');
const statusEl = document.getElementById('status');
const modal = document.getElementById('blogModal');
const closeModal = document.getElementById('closeModal');
const blogTitle = document.getElementById('blogTitle');
const blogMeta = document.getElementById('blogMeta');
const blogContent = document.getElementById('blogContent');

let blogs = [];
const SEARCH_HISTORY_KEY = 'acadly-blog-searches';
const MAX_SEARCHES = 10;

/**
 * Normalize text for case-insensitive comparison
 */
function normalize(value) {
  return String(value || '').toLowerCase();
}

/**
 * Filter blogs based on search query
 */
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

/**
 * Render blog cards to the grid
 */
function renderCards(list) {
  if (!list.length) {
    blogList.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-slate-400 text-lg">No blogs found. Try a different search or <a href="blog-editor.html" class="text-cyan-400 hover:text-cyan-300 font-semibold">create one</a>!</p></div>';
    statusEl.textContent = 'No blogs matched your search.';
    return;
  }

  statusEl.textContent = `${list.length} blog${list.length === 1 ? '' : 's'} found`;

  blogList.innerHTML = list.map((blog) => {
    const tags = (blog.tags || [])
      .slice(0, 3)
      .map((tag) => `<span class="tag"><i class="fa-solid fa-tag mr-1"></i>${escapeHtml(tag)}</span>`)
      .join('');
    
    const moreTagsCount = (blog.tags || []).length - 3;
    const moreTagsText = moreTagsCount > 0 ? `<span class="tag text-xs">+${moreTagsCount} more</span>` : '';

    return `
      <article class="card" data-slug="${escapeHtml(blog.slug)}">
        <h3 title="${escapeHtml(blog.title)}">${escapeHtml(blog.title)}</h3>
        <div class="meta">
          <span><i class="fa-solid fa-user text-cyan-400"></i>${escapeHtml(blog.author || 'Unknown')}</span>
          <span><i class="fa-solid fa-calendar text-cyan-400"></i>${escapeHtml(blog.date || 'No date')}</span>
        </div>
        <p class="excerpt">${escapeHtml(blog.excerpt || 'No excerpt available')}</p>
        <div class="tags">${tags}${moreTagsText}</div>
        <button class="read-btn" data-slug="${escapeHtml(blog.slug)}">
          <i class="fa-solid fa-arrow-right mr-2"></i>Read Full Article
        </button>
      </article>
    `;
  }).join('');

  // Bind click handlers to newly created cards
  bindCardEvents();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Open and display a blog in the modal
 */
async function openBlog(slug) {
  const blog = blogs.find((entry) => entry.slug === slug);
  if (!blog) {
    statusEl.textContent = 'Blog not found.';
    return;
  }

  // Show loading state
  blogTitle.textContent = 'Loading...';
  blogContent.innerHTML = '<div class="text-center text-slate-400">Fetching content...</div>';
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');

  try {
    const extension = blog.ext || 'md';
    const response = await fetch(`/blogs/${slug}.${extension}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    
    // Update modal with blog content
    blogTitle.textContent = blog.title;
    
    // Enhanced meta display with icons
    const metaItems = [
      `<span><i class="fa-solid fa-user"></i> ${escapeHtml(blog.author || 'Unknown')}</span>`,
      `<span><i class="fa-solid fa-calendar"></i> ${escapeHtml(blog.date || 'No date')}</span>`,
      `<span><i class="fa-solid fa-file-lines"></i> ${escapeHtml(blog.format || 'markdown')}</span>`
    ];
    
    if (blog.tags && blog.tags.length > 0) {
      const tagsHtml = blog.tags.map(tag => `<span class="inline-block bg-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded">${escapeHtml(tag)}</span>`).join(' ');
      metaItems.push(`<span class="w-full flex gap-1 flex-wrap">${tagsHtml}</span>`);
    }
    
    blogMeta.innerHTML = metaItems.join('');

    // Render content based on format
    if (blog.format === 'html') {
      blogContent.innerHTML = content;
    } else {
      // Parse markdown
      blogContent.innerHTML = marked.parse(content);
      
      // Render LaTeX math if KaTeX is available
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(blogContent, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\[', right: '\\]', display: true },
              { left: '\\(', right: '\\)', display: false }
            ],
            throwOnError: false
          });
        } catch (mathError) {
          console.warn('KaTeX rendering error:', mathError);
        }
      }
    }

    // Save search history
    saveSearchHistory(blog.title);

    // Scroll to top of modal
    modal.querySelector('.modal-body').scrollTop = 0;

  } catch (error) {
    console.error('Blog loading error:', error);
    blogTitle.textContent = 'Error Loading Blog';
    blogContent.innerHTML = `
      <div class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-300">
        <p><strong>Error:</strong> ${escapeHtml(error.message)}</p>
        <p class="text-sm mt-2">The blog file could not be loaded. Please try again later.</p>
      </div>
    `;
    statusEl.textContent = `Error loading blog: ${error.message}`;
  }
}

/**
 * Save search term to history
 */
function saveSearchHistory(term) {
  try {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    const filtered = history.filter(item => item !== term);
    const updated = [term, ...filtered].slice(0, MAX_SEARCHES);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Bind events to dynamically created card elements
 */
function bindCardEvents() {
  blogList.addEventListener('click', (event) => {
    const readButton = event.target.closest('[data-slug]');
    if (!readButton) return;
    
    const slug = readButton.dataset.slug;
    openBlog(slug);
  });
}

/**
 * Bind global events
 */
function bindEvents() {
  // Search input with debouncing
  let searchTimeout;
  searchInput.addEventListener('input', (event) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderCards(filterBlogs(event.target.value));
    }, 150);
  });

  // Close modal on button click
  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    blogContent.innerHTML = '';
  });

  // Close modal on background click
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal.click();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('active')) {
      closeModal.click();
    }
  });

  // Focus search on Ctrl+K or Cmd+K
  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      searchInput.focus();
    }
  });
}

/**
 * Load blogs from metadata.json
 */
async function loadBlogs() {
  statusEl.textContent = 'Loading blogs...';
  try {
    const response = await fetch('/blogs/metadata.json');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch blog metadata`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid metadata format: expected array');
    }

    blogs = data.sort((a, b) => {
      // Sort by date (newest first)
      if (a.date && b.date) {
        return new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

    if (blogs.length === 0) {
      statusEl.textContent = 'No blogs published yet. Check back soon!';
      return;
    }

    renderCards(blogs);

  } catch (error) {
    console.error('Blog metadata loading error:', error);
    statusEl.innerHTML = `
      <div class="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 text-yellow-300">
        <strong>Note:</strong> Unable to load blog metadata. ${error.message}
        <p class="text-sm mt-2">Make sure a <code class="bg-slate-800 px-2 py-1 rounded">/blogs/metadata.json</code> file exists with blog entries.</p>
      </div>
    `;
    blogList.innerHTML = '';
  }
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    loadBlogs();
  });
} else {
  bindEvents();
  loadBlogs();
}
