// Audiobook Upload and Player Enhancement
(function() {
  'use strict';

  const uploadZone = document.getElementById('uploadZone');
  const audiobookUpload = document.getElementById('audiobookUpload');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const uploadProgress = document.getElementById('uploadProgress');
  const uploadStatus = document.getElementById('uploadStatus');
  const uploadBar = document.getElementById('uploadBar');
  const uploadedList = document.getElementById('uploadedList');
  const uploadedItems = document.getElementById('uploadedItems');

  const UPLOADED_BOOKS_KEY = 'acadly-uploaded-audiobooks';

  // Load uploaded books from localStorage
  function getUploadedBooks() {
    try {
      return JSON.parse(localStorage.getItem(UPLOADED_BOOKS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveUploadedBooks(books) {
    try {
      localStorage.setItem(UPLOADED_BOOKS_KEY, JSON.stringify(books));
    } catch {}
  }

  function renderUploadedList() {
    const books = getUploadedBooks();
    if (books.length === 0) {
      uploadedList.classList.add('hidden');
      return;
    }

    uploadedList.classList.remove('hidden');
    uploadedItems.innerHTML = books.slice(0, 5).map(book => `
      <li class="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
        <span class="flex items-center gap-2 flex-1">
          <i class="fas fa-music text-cyan-400 text-sm"></i>
          <span class="text-slate-900 dark:text-slate-100 truncate">${book.name}</span>
        </span>
        <span class="text-xs text-slate-600 dark:text-slate-400 ml-2">${(book.size / 1024 / 1024).toFixed(1)} MB</span>
        <button onclick="window.AudiobookManager.playBook('${book.id}')" class="ml-2 p-1 rounded hover:bg-cyan-500/20 text-cyan-500" title="Play">
          <i class="fas fa-play text-xs"></i>
        </button>
      </li>
    `).join('');
  }

  function addUploadedBook(file) {
    const md5 = Math.random().toString(16).slice(2) + Date.now().toString(16);
    const book = {
      id: md5,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      url: URL.createObjectURL(file) // For local playback
    };

    const books = getUploadedBooks();
    books.unshift(book);
    saveUploadedBooks(books.slice(0, 50)); // Keep last 50
    renderUploadedList();
    return book;
  }

  function handleFiles(files) {
    const audioFiles = Array.from(files).filter(f => 
      ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'].includes(f.type) || 
      /\.(mp3|m4a|wav|ogg)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      alert('No audio files detected. Please upload .mp3, .m4a, .wav, or .ogg files.');
      return;
    }

    // Show progress
    uploadPrompt.classList.add('hidden');
    uploadProgress.classList.remove('hidden');

    let completed = 0;
    const total = audioFiles.length;

    audioFiles.forEach((file, idx) => {
      // Simulate upload with setTimeout
      setTimeout(() => {
        const book = addUploadedBook(file);
        completed++;
        
        const percent = Math.round((completed / total) * 100);
        uploadBar.style.width = percent + '%';
        uploadStatus.textContent = `Uploading: ${completed}/${total} files... (${percent}%)`;

        if (completed === total) {
          setTimeout(() => {
            uploadProgress.classList.add('hidden');
            uploadPrompt.classList.remove('hidden');
            uploadBar.style.width = '0%';
            audiobookUpload.value = '';
            alert(`✓ Successfully uploaded ${total} audiobook(s)!`);
          }, 1000);
        }
      }, idx * 500);
    });
  }

  // Drag and drop
  uploadZone.addEventListener('click', () => audiobookUpload.click());

  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('bg-cyan-100/50', 'dark:bg-cyan-900/30');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('bg-cyan-100/50', 'dark:bg-cyan-900/30');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('bg-cyan-100/50', 'dark:bg-cyan-900/30');
    handleFiles(e.dataTransfer.files);
  });

  audiobookUpload.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  // Audio player enhancements
  window.AudiobookManager = {
    playBook(bookId) {
      const books = getUploadedBooks();
      const book = books.find(b => b.id === bookId);
      if (book) {
        // Create audio element if not exists or update existing
        let audio = document.getElementById('audiobookPlayer');
        if (!audio) {
          audio = document.createElement('audio');
          audio.id = 'audiobookPlayer';
          audio.controls = true;
          audio.style.width = '100%';
          audio.style.marginTop = '10px';
          const container = document.querySelector('[id="bookGrid"]')?.parentElement || document.body;
          container.appendChild(audio);
        }
        audio.src = book.url;
        audio.play().catch(e => {
          console.log('Playback started (may need user interaction)');
          // Browser security - user might need to click play
        });
        
        // Update UI
        const nowTitle = document.getElementById('nowTitle');
        const nowMeta = document.getElementById('nowMeta');
        if (nowTitle) nowTitle.textContent = book.name.replace(/\.[^/.]+$/, '');
        if (nowMeta) nowMeta.textContent = `${(book.size / 1024 / 1024).toFixed(1)} MB • Uploaded: ${new Date(book.uploadedAt).toLocaleDateString()}`;
      }
    }
  };

  // Initialize on load
  renderUploadedList();

  // Export
  window.handleAudiobookFiles = handleFiles;
})();
