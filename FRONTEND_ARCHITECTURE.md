# 🎨 Frontend Architecture & Component Guide

**Comprehensive frontend structure and component documentation for Acadly Platform**

---

## 📊 Frontend Overview

The Acadly frontend is built with:
- **Vanilla JavaScript** (ES6+)
- **HTML5** with semantic markup
- **Tailwind CSS** for styling
- **Dark/Light theme support**
- **Responsive design** (mobile-first)

---

## 🏗️ Folder Structure

```
Frontend/
├── Homepage.html                 # Main landing/hub page
├── Dashboard pages
│   ├── dashboard_v2.html        # Student dashboard v2
│   └── dashboard-live.html      # Live progress dashboard
├── Learning modules
│   ├── videoplayer-live.html    # Video player with quizzes
│   ├── roadmap.html             # Learning path roadmap
│   ├── practicelab.html         # Practice & quiz interface
│   ├── library.html             # PDF/resource library
│   └── 3d-lab.html              # 3D model viewer
├── Content modules
│   ├── audiobook.html           # Audiobook player
│   ├── blogs.html               # Blog reader
│   ├── flashcards.html          # Study flashcards
│   ├── mind-map.html            # Mind map viewer
│   └── timetable.html           # Schedule management
├── AI & Support
│   └── ai-assistant.html        # AI chatbot interface
├── Authentication
│   ├── Login.html               # Login form
│   └── signin.html              # Sign-in page
├── JS/ folder
│   ├── auth.js                  # Authentication logic
│   ├── video-metadata.js        # Video data & quiz questions
│   ├── api.js                   # API client utilities
│   ├── ui.js                    # UI helper functions
│   └── library.js               # PDF library utilities
├── CSS/ folder
│   ├── styles.css               # Main stylesheet
│   ├── dark-mode.css            # Dark theme
│   ├── responsive.css           # Mobile styles
│   └── dashboard.css            # Dashboard specific
├── public/ folder
│   ├── images/                  # Logos, icons, graphics
│   ├── videos/                  # Local video files
│   ├── pdfs/                    # Local PDF files
│   └── home.css                 # Tailwind styles
└── Modules images/              # Placeholder/module images
```

---

## 🎯 Main Components

### 1. **Homepage.html**

The central hub providing navigation to all modules.

**Key Sections:**
- Navigation bar (sticky/fixed)
- Hero section with CTA
- Feature cards grid
- Module shortcuts
- Testimonials
- Footer with links

**Navigation Pattern:**
```html
<a href="/dashboard-live.html">Go to Dashboard</a>
<a href="/videoplayer-live.html">Start Learning</a>
<a href="/library.html">Browse Resources</a>
```

**Key JavaScript Functions:**
```javascript
// Check if user is logged in
const isLoggedIn = !!localStorage.getItem('authToken');

// Navigate to module
window.location.href = '/videoplayer-live.html';

// Show notifications
showNotification('Welcome back!', 'success');
```

---

### 2. **Dashboard Pages**

#### dashboard-live.html (Student Dashboard)

Real-time analytics and progress tracking.

**Layout:**
```
┌─────────────────────────────────┐
│  Profile & XP Summary          │
├─────────────────────────────────┤
│  Quick Stats (4 cards)          │
│  - Total XP                     │
│  - Current Level                │
│  - Streak Count                 │
│  - Videos Watched               │
├─────────────────────────────────┤
│  Recent Activity                │
│  Last watched videos            │
├─────────────────────────────────┤
│  Progress Charts                │
│  - Daily activity               │
│  - Weekly summary               │
├─────────────────────────────────┤
│  Recommendations                │
│  - Suggested next videos        │
│  - Trending topics              │
└─────────────────────────────────┘
```

**Key Data Points:**
```javascript
{
  userId: 1,
  totalXP: 2450,
  currentLevel: 5,
  streak: 7,
  videosWatched: 32,
  completionRate: 68,
  recentActivity: [...],
  recommendations: [...]
}
```

**API Calls:**
```javascript
// Fetch dashboard data
fetch('/api/dashboard')
  .then(res => res.json())
  .then(data => renderDashboard(data));

// Update progress
fetch('/api/progress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, videoId, progress })
});
```

---

### 3. **videoplayer-live.html**

Core learning interface with video streaming and quizzes.

**Layout:**
```
┌────────────────────────────────┐
│  Video Player                  │
│  ┌──────────────────────────┐  │
│  │   [Video Stream]         │  │
│  │   Controls: Play,Speed   │  │
│  └──────────────────────────┘  │
├────────────────────────────────┤
│  Sidebar                       │
│  ├─ Playlist                   │
│  ├─ Chapters                   │
│  └─ Transcript                 │
├────────────────────────────────┤
│  Quiz Section                  │
│  Q: Multiple choice            │
│  [Submit] [Skip]               │
├────────────────────────────────┤
│  Recommendations               │
│  - Next video                  │
│  - Related topics              │
└────────────────────────────────┘
```

**Key Features:**
- Auto-resume from last position
- Playback speed control (0.5x - 2x)
- Full-screen mode
- Subtitle support
- Quiz on completion
- XP rewards

**JavaScript Functions:**
```javascript
// Load video
function loadVideo(videoId) {
  fetch(`/api/videos/${videoId}`)
    .then(res => res.json())
    .then(video => {
      displayVideo(video);
      resumeFromLastPosition(videoId);
    });
}

// Auto-save progress
function saveProgress(videoId, currentTime, duration) {
  const progress = (currentTime / duration) * 100;
  localStorage.setItem(`video_${videoId}`, currentTime);
  
  fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, progress })
  });
}

// Submit quiz answer
function submitQuizAnswer(quizId, selectedOption) {
  fetch(`/api/quiz/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ selectedOption })
  })
    .then(res => res.json())
    .then(result => {
      if (result.isCorrect) {
        awardXP(result.xpEarned);
        showSuccess('Correct! +50 XP');
      }
    });
}
```

---

### 4. **library.html** (PDF Library)

Advanced document management system.

**Key Features:**
- Search (full-text)
- Sort (by name, date, size)
- Filtering (by category)
- Collections (custom grouping)
- Favorites
- Reading history
- Download functionality
- Responsive grid/list views

**Layout:**
```
┌─────────────────────────────────┐
│  Search & Filters              │
│  [Search...] [Sort ▼] [View ⊡] │
├─────────────────────────────────┤
│  PDF Grid/List                  │
│  ┌─────────┐ ┌─────────┐       │
│  │ PDF 1   │ │ PDF 2   │       │
│  │ Preview │ │ Preview │       │
│  │ Date    │ │ Date    │       │
│  │ [❤] [⬇] │ │ [❤] [⬇] │      │
│  └─────────┘ └─────────┘       │
└─────────────────────────────────┘
```

**API Methods:**
```javascript
// Fetch PDFs with pagination
async function fetchPDFs(page = 1, limit = 12) {
  const response = await fetch(`/api/pdfs?page=${page}&limit=${limit}`);
  return response.json();
}

// Search PDFs
async function searchPDFs(query) {
  const response = await fetch(`/api/pdfs/search?q=${query}`);
  return response.json();
}

// Stream PDF
function streamPDF(pdfId) {
  const pdfStream = `/api/pdfs/${pdfId}/stream`;
  openPDFViewer(pdfStream);
}

// Add to favorites
async function toggleFavorite(pdfId) {
  const response = await fetch(`/api/pdfs/${pdfId}/favorite`, {
    method: 'POST'
  });
  return response.json();
}
```

---

### 5. **roadmap.html** (Learning Path)

Interactive learning progression visualization.

**Features:**
- Subject selection
- Level-based progression
- Topic hierarchy
- Completion tracking
- Prerequisite unlocking
- Assessment nodes
- Certificate milestone

**Visualization:**
```
Subject: Physics

Level 1: Fundamentals        [50% ✓]
├── 1.1: Kinematics         [✓ 100%]
├── 1.2: Forces             [● 75%]
├── 1.3: Energy             [○ 0%]
└── Quiz: Level 1           [✓ Passed]

Level 2: Mechanics          [0%]
├── 2.1: Motion             [Locked]
└── Quiz: Level 2           [Locked]

Level 3: Thermodynamics     [0%]
└── [Locked: Complete L2]
```

---

### 6. **3d-lab.html** (3D Model Viewer)

Interactive 3D learning environment.

**Technology:**
- Three.js (3D rendering)
- glTF/GLTF model format
- WebGL acceleration

**Key Controls:**
- Left-click: Rotate
- Right-click: Pan
- Scroll: Zoom
- Space: Reset view
- R: Reset orientation
- F: Toggle fullscreen

**JavaScript Setup:**
```javascript
// Initialize 3D Scene
function initScene() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('canvas').appendChild(renderer.domElement);
  
  // Load 3D model
  loadGLTFModel('/models/anatomy-skeleton.gltf', scene);
  
  animate();
}

// Load model
function loadGLTFModel(path, scene) {
  const loader = new THREE.GLTFLoader();
  loader.load(path, (gltf) => {
    scene.add(gltf.scene);
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
```

---

### 7. **ai-assistant.html** (Chatbot)

Intelligent support via external AI API.

**Conversation Flow:**
```
User: "Explain photosynthesis"
  ↓
API: OpenAI/Claude/Gemini
  ↓
Bot: "Photosynthesis is the process..."
  ↓
User: "Simplify that"
  ↓
Bot: "In simple terms: Plants use sunlight..."
```

**Message Structure:**
```javascript
{
  id: "msg_123",
  role: "user|assistant",
  content: "Your message here",
  timestamp: 1234567890,
  typing: false
}
```

**API Call:**
```javascript
async function sendMessage(userMessage) {
  const response = await fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userMessage,
      conversationId: currentConversationId,
      context: 'academic_support'
    })
  });
  
  const data = await response.json();
  displayBotMessage(data.reply);
  saveConversation(data);
}
```

---

## 🎨 Styling System

### Color Scheme

```css
/* Light Mode */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --accent: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --border: #e5e7eb;
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #ffffff;
  --text-secondary: #cbd5e1;
  --accent: #60a5fa;
  --success: #34d399;
  --warning: #fbbf24;
  --error: #f87171;
  --border: #334155;
}
```

### Tailwind Configuration

```javascript
module.exports = {
  content: ['./Frontend/**/*.html'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        accent: 'var(--accent)',
      }
    }
  }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First */
/* XS: 0px (default) */

/* SM: 640px */
@media (min-width: 640px) {
  /* tablet styles */
}

/* MD: 768px */
@media (min-width: 768px) {
  /* medium screens */
}

/* LG: 1024px */
@media (min-width: 1024px) {
  /* large screens */
}

/* XL: 1280px */
@media (min-width: 1280px) {
  /* extra large screens */
}
```

---

## 🔄 State Management

### localStorage Pattern

```javascript
// Save user preferences
function savePreferences(prefs) {
  localStorage.setItem('acadly_prefs', JSON.stringify(prefs));
}

// Load preferences
function loadPreferences() {
  return JSON.parse(localStorage.getItem('acadly_prefs')) || {};
}

// Session state
class SessionState {
  constructor() {
    this.user = null;
    this.currentVideo = null;
    this.progress = {};
  }
  
  setUser(userData) {
    this.user = userData;
    sessionStorage.setItem('user', JSON.stringify(userData));
  }
  
  getUser() {
    return this.user || JSON.parse(sessionStorage.getItem('user'));
  }
}

const session = new SessionState();
```

---

## 🔌 API Integration

### API Client Pattern

```javascript
// API Base Configuration
const API_BASE_URL = 'http://localhost:3000';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage
async function getVideos() {
  return apiCall('/api/videos');
}

async function submitProgress(videoId, progress) {
  return apiCall('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ videoId, progress })
  });
}
```

---

## ✅ Best Practices

### Code Organization
- One major feature per HTML file
- Separate CSS files for each page
- Shared utilities in js/ folder
- Clear naming conventions

### Performance
- Lazy load images: `loading="lazy"`
- Defer non-critical scripts: `defer`
- Minify CSS/JS in production
- Cache API responses when appropriate

### Accessibility
- Semantic HTML (`<header>`, `<nav>`, `<main>`)
- ARIA labels for interactive elements
- Keyboard navigation support
- Sufficient color contrast (WCAG AA)

### Security
- Sanitize user input
- Store tokens securely
- Validate API responses
- Use HTTPS in production

---

## 🚀 Development Workflow

### Adding New Page

```bash
# 1. Create new HTML file
touch Frontend/new-feature.html

# 2. Create CSS file
touch Frontend/CSS/new-feature.css

# 3. Link from Homepage.html
<a href="/new-feature.html">New Feature</a>

# 4. Import in JS if needed
<script src="/js/new-feature.js"></script>

# 5. Test locally
# http://localhost:3000/new-feature.html
```

### Testing Frontend

```javascript
// Test API integration
async function testAPI() {
  try {
    const videos = await apiCall('/api/videos');
    console.log('✓ Videos loaded:', videos.length);
  } catch (error) {
    console.error('✗ API error:', error);
  }
}

// Run in browser console
testAPI();
```

---

**For detailed implementation examples, see individual HTML files in Frontend/ folder**

*Last Updated: April 2024 | Maintained by Acadly Team*
