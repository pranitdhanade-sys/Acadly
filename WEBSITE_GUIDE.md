# 🎓 ACADLY WEBSITE - COMPLETE SETUP & OPERATIONS GUIDE

**Last Updated:** April 9, 2026  
**Version:** 2.0 (Fully Configured & Tested)  
**Status:** ✅ Production Ready

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Hardware & Software Requirements](#hardware--software-requirements)
3. [Installation & Setup](#installation--setup)
4. [Database Configuration](#database-configuration)
5. [Environment Variables](#environment-variables)
6. [Running the Application](#running-the-application)
7. [Features & Modules](#features--modules)
8. [API Documentation](#api-documentation)
9. [Frontend Components](#frontend-components)
10. [Project Structure](#project-structure)
11. [Troubleshooting](#troubleshooting)
12. [Development Workflow](#development-workflow)
13. [Deployment](#deployment)

---

## 🌍 SYSTEM OVERVIEW

### What is Acadly?

**Acadly** is a comprehensive **full-stack academic management system** built for educational institutions. It provides:

- ✅ **Video Learning Platform** - Adaptive video player with auto-resume & XP tracking
- ✅ **Live Progress Tracking** - Real-time XP, streaks, and achievement tracking
- ✅ **Resource Hub** - Centralized PDFs, 3D models, and educational materials
- ✅ **Practice Labs** - Quiz generation and adaptive testing system
- ✅ **Learning Paths** - Structured roadmaps and learning progress
- ✅ **Dashboard** - Role-based dashboards for students, teachers, and admins
- ✅ **AI Assistant** - Intelligent chatbot for student support
- ✅ **Blog System** - Educational content and announcements

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | HTML5 + Vanilla JavaScript | ES6+ |
| **Styling** | Tailwind CSS | Latest |
| **Backend** | Node.js | v18+ |
| **Framework** | Express.js | v5.1+ |
| **Primary DB** | MySQL | v8+ |
| **Optional DB** | MongoDB | v5.0+ |
| **Authentication** | JWT + bcryptjs | Latest |
| **Server** | HTTP/HTTPS | Ready |

---

## 🖥️ HARDWARE & SOFTWARE REQUIREMENTS

### Minimum System Requirements

**For Development:**
- CPU: Dual-core 2.0 GHz processor
- RAM: 4 GB
- Storage: 2 GB free space
- OS: Windows 10+, macOS, or Linux (Ubuntu 20.04+)

**For Production:**
- CPU: Quad-core 2.4 GHz processor
- RAM: 8 GB
- Storage: 10 GB SSD
- Bandwidth: 10 Mbps stable internet

### Software Prerequisites

**Required:**
```
✓ Node.js v18.0.0 or higher
✓ npm v9.0.0 or higher
✓ MySQL 8.0+ (local or remote)
✓ Git (for version control)
```

**Optional:**
```
○ MongoDB v5.0+ (for video streaming features)
○ Docker & Docker Compose (for containerization)
○ Visual Studio Code (recommended IDE)
○ Postman (for API testing)
```

### Verify Installation

```bash
# Check Node.js
node --version          # Should be v18.0.0+

# Check npm
npm --version          # Should be v9.0.0+

# Check Git
git --version          # Should display version

# Check MySQL (if installed locally)
mysql --version        # Should be 8.0+
```

---

## 📦 INSTALLATION & SETUP

### STEP 1: Clone the Repository

```bash
# Navigate to your projects directory
cd /path/to/projects

# Clone the Acadly repository
git clone https://github.com/pranitdhanade-sys/Acadly.git

# Navigate into the project
cd Acadly

# Check the current branch
git branch -a

# Ensure you're on the main branch
git checkout main
git pull origin main
```

### STEP 2: Install Node.js Dependencies

```bash
# Install backend dependencies (from Backend folder)
cd Backend
npm install

# Wait for installation to complete
# You should see: "added X packages"

# Return to root directory
cd ..
```

**Expected Output:**
```
up to date, 15 packages in 5.38s
```

### STEP 3: Create Environment Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your actual credentials
# Use your preferred editor (VS Code, Notepad++, etc.)
```

**Edit `./.env` file:**

```env
# ==================== SERVER ====================
PORT=3000
NODE_ENV=development

# ==================== MySQL DATABASE ====================
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=acadly_db

# ==================== AUTHENTICATION ====================
JWT_SECRET=your_secret_key_minimum_32_characters_recommended_64
JWT_REFRESH_SECRET=another_secret_key_minimum_32_characters
ADMIN_SECRET_KEY=admin-secret-key-minimum-32-chars

# ==================== MONGODB (Optional) ====================
MONGO_URI=mongodb://localhost:27017/acadly_videos

# ==================== CORS & SECURITY ====================
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
TRUST_PROXY=false

# ==================== OPTIONAL: HTTPS ====================
# FORCE_HTTPS=false
# TLS_KEY_PATH=/path/to/private.key
# TLS_CERT_PATH=/path/to/certificate.crt
```

### STEP 4: Setup MySQL Database

#### If MySQL is NOT running:

**Windows:**
```bash
# Using XAMPP
# 1. Open XAMPP Control Panel
# 2. Click "Start" next to Apache and MySQL

# Or if installed separately:
net start MySQL80
```

**macOS:**
```bash
# Using Homebrew
brew services start mysql

# Verify it's running
mysql -u root -p
```

**Linux (Ubuntu):**
```bash
sudo systemctl start mysql
sudo mysql -u root
```

#### Initialize the Database:

```bash
# From Backend directory
node setup-db.js

# You should see output like:
# ✅ Database 'acadly_db' created successfully
# ✅ All tables created
# ✅ Sample data seeded
```

**If setup fails:**

```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1;"

# Check credentials in .env file
# Try with empty password if using default MySQL:
DB_PASSWORD=

# Manual database creation (optional):
mysql -u root -p
CREATE DATABASE acadly_db;
EXIT;
```

---

## 🗄️ DATABASE CONFIGURATION

### Database Schema Overview

The system uses **8+ tables** organized by functional domain:

#### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts | id, email, password_hash, role, created_at |
| `user_profiles` | Extended user data | user_id, full_name, avatar_url, bio |
| `roles` | Role definitions | id, role_name, permissions |

#### Learning Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `videos` | Video metadata | id, title, url, category, duration |
| `quiz_questions` | Quiz questions | id, video_id, question_text, options |
| `user_progress` | Watch history | id, user_id, video_id, progress_percent |
| `user_xp` | Experience points | user_id, total_xp, current_level, streak |

#### Content Tables
| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `pdfs` | PDF documents | id, title, file_path, category |
| `blogs` | Blog posts | id, author_id, title, content, published_at |
| `3d_models` | 3D model metadata | id, title, model_file, category |

### Database Relationships

```
users (1) ──→ (∞) user_progress
           ──→ (∞) user_xp
           ──→ (∞) blogs (as author)

videos (1) ──→ (∞) user_progress
           ──→ (∞) quiz_questions

users (1) ──→ (∞) roles (many-to-many through user_roles)
```

### Seed Data

The setup script inserts sample data:
- **5 test users** (student, teacher, admin)
- **20 sample videos** with metadata
- **50+ quiz questions**
- **10 PDF documents**
- **15 blog posts**
- **10 3D models**

---

## 🔐 ENVIRONMENT VARIABLES

### Complete Reference

```env
# ==================== SERVER CONFIGURATION ====================
# Port the Express server will listen on
PORT=3000

# Application environment: development | production | staging
NODE_ENV=development

# ==================== MySQL DATABASE ====================
# MySQL server hostname (localhost for local, IP for remote)
DB_HOST=localhost

# MySQL server port (default: 3306)
DB_PORT=3306

# MySQL username (default: root for XAMPP)
DB_USER=root

# MySQL password (empty if using XAMPP default)
DB_PASSWORD=

# Database name to use
DB_NAME=acadly_db

# ==================== AUTHENTICATION ====================
# Secret key for signing JWT tokens (MUST be >32 chars)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_very_long_secret_key_here_minimum_32_characters

# Secret for refresh tokens (separate key recommended)
JWT_REFRESH_SECRET=another_very_long_secret_for_refresh_tokens_minimum_32_char

# Admin API key (for /api/admin endpoints)
ADMIN_SECRET_KEY=admin-secret-key-minimum-32-characters

# JWT token expiration (in seconds): 1 day = 86400, 7 days = 604800
JWT_EXPIRY=604800

# ==================== MONGODB (OPTIONAL) ====================
# MongoDB connection string for GridFS video streaming
# Local: mongodb://localhost:27017/acadly_videos
# Atlas: mongodb+srv://username:password@cluster.mongodb.net/acadly_videos
MONGO_URI=mongodb://localhost:27017/acadly_videos

# ==================== CORS & SECURITY ====================
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://acadly.com

# Enable trust proxy (for production behind reverse proxy)
TRUST_PROXY=false

# ==================== HTTPS/TLS (OPTIONAL) ====================
# Force HTTPS redirect
FORCE_HTTPS=false

# Path to TLS private key
# TLS_KEY_PATH=/path/to/private.key

# Path to TLS certificate
# TLS_CERT_PATH=/path/to/certificate.crt

# Path to CA certificate chain (if using self-signed)
# TLS_CA_PATH=/path/to/ca.crt

# ==================== EMAIL CONFIGURATION (OPTIONAL) ====================
# SMTP configuration for password reset emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@acadly.com

# ==================== AWS S3 (OPTIONAL) ====================
# For cloud video storage instead of MongoDB
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=acadly-videos
AWS_REGION=us-east-1

# ==================== LOGGING & MONITORING ====================
# Log level: error | warn | info | debug
LOG_LEVEL=info

# Enable detailed request logging
DEBUG=false
```

### Generate Secure Secrets

```bash
# Generate a 64-character secret key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

## 🚀 RUNNING THE APPLICATION

### START THE SERVER

#### For Development (with auto-reload):

```bash
cd Backend

# Start with nodemon (auto-restarts on file changes)
npm run dev
```

**Expected Output:**
```
[nodemon] 3.1.10
[nodemon] to restart at any time, type `rs`

🚀 HTTP server running at http://localhost:3000
✅ MySQL pool initialized
✅ Auth routes mounted at /api/auth
✅ Video routes mounted at /api/videos
✅ Progress routes mounted at /api/progress
✅ Dashboard routes mounted at /api/dashboard
```

#### For Production:

```bash
cd Backend

# Start without nodemon
npm start

# Or using a process manager (PM2):
npm install -g pm2
pm2 start server.js --name "acadly"
pm2 save
```

#### Using Docker:

```bash
# Build Docker image
docker build -t acadly:latest .

# Run container
docker run -p 3000:3000 --env-file .env acadly:latest

# Or using Docker Compose
docker-compose up -d
```

### ACCESS THE APPLICATION

**Homepage:**
```
http://localhost:3000
```

**Role-Based Access:**

| Role | Default Login | Dashboard URL |
|------|---------------|--------------|
| **Student** | student@acadly.com | http://localhost:3000/dashboard-live.html |
| **Teacher** | teacher@acadly.com | http://localhost:3000/dashboard_v2.html |
| **Admin** | admin@acadly.com | http://localhost:3000/api/admin |

**Default Password:** `password123` (change in production!)

### Key Pages & URLs

| Feature | URL | Description |
|---------|-----|-----------|
| **Home** | `/` | Landing page |
| **Login** | `/Login.html` | User authentication |
| **Dashboard** | `/dashboard-live.html` | Student live dashboard |
| **Video Player** | `/videoplayer-live.html` | Watch videos with auto-resume |
| **Library** | `/library.html` | Browse PDFs & resources |
| **Practice Lab** | `/practicelab.html` | Quiz & test interface |
| **Learning Path** | `/roadmap.html` | Structured learning journey |
| **AI Assistant** | `/ai-assistant.html` | Chatbot interface |
| **3D Lab** | `/3d-lab.html` | 3D model viewer |
| **Blogs** | `/blogs.html` | Read & search blog posts |
| **Admin Panel** | `/api/admin` | Administration controls |

---

## 🎯 FEATURES & MODULES

### 1. VIDEO LEARNING MODULE

**Features:**
- 🎬 Adaptive video player with playback speed control
- ⏸️ Auto-resume from last watched position
- 📊 Real-time progress tracking (every 5 seconds)
- 🏆 XP rewards for video completion
- 📝 Integrated quiz system
- 📱 Responsive design (desktop & mobile)

**Files:**
- Backend: `Backend/routes/videos.js`
- Frontend: `Frontend/videoplayer-live.html`
- Sync Logic: `Frontend/js/sync-manager.js`

**API Endpoints:**
```
POST   /api/progress/save-watch-time    → Auto-save watch position
POST   /api/progress/video-complete     → Award XP on completion
GET    /api/progress/continue-watching  → Get resume list
GET    /api/videos/playlist             → Get all videos
POST   /api/videos/upload               → Upload new video
```

### 2. LIVE PROGRESS TRACKING

**Features:**
- ⚡ Real-time XP updates (live counter)
- 📈 Achievement streaks & milestones
- 🎮 Gamified learning experience
- 🔄 Auto-sync without page refresh
- 📊 Historical progress tracking
- 🏅 Level system (1-50+)

**Files:**
- Backend: `Backend/routes/progress.js`
- Frontend: `Frontend/dashboard-live.html`
- Logic: `Frontend/js/sync-manager.js`

**Database:**
```sql
SELECT * FROM user_xp WHERE user_id = ?;
SELECT * FROM user_progress WHERE user_id = ?;
```

### 3. RESOURCE LIBRARY

**Modules:**

#### PDF Library
- 📄 Centralized PDF storage
- 🔍 Full-text search
- 🏷️ Categorization & tagging
- 📥 Upload interface
- ⭐ Rating & feedback

Files: `Backend/routes/pdf-library.js`, `Frontend/library.html`

#### 3D Model Viewer
- 🎨 Three.js integration
- 🔄 Interactive 3D rendering
- 📦 Model upload & management
- 🎬 Animation playback
- 📱 Mobile-friendly

Files: `Backend/routes/models3d.js`, `Frontend/3d-lab.html`

#### Blog System
- ✍️ Blog editor interface
- 📝 Markdown support
- 🏷️ Category & tag system
- 💬 Comments & engagement
- 📅 Publication scheduling

Files: `Frontend/blogs.html`, `Frontend/blog-editor.html`

### 4. PRACTICE LABS & QUIZZES

**Features:**
- ❓ Adaptive quiz generation
- 📊 Performance analytics
- ⏱️ Timed tests
- 📈 Progress tracking
- 🎯 Difficulty levels
- 📋 Question banks

**Files:**
- Backend: `Backend/routes/practicelab.js`
- Frontend: `Frontend/practicelab.html`

### 5. LEARNING PATHS (ROADMAPS)

**Features:**
- 🗺️ Structured learning journeys
- 🔗 Module prerequisites
- 📍 Progress milestones
- 🎯 Learning objectives
- 🔄 Iterative pathways

**Files:**
- Backend: `Backend/routes/roadmap.js`
- Frontend: `Frontend/roadmap.html`

### 6. AI ASSISTANT

**Features:**
- 🤖 Intelligent chatbot
- 💡 Student support
- ❓ FAQ automation
- 🎓 Learning guidance
- 🔗 Integration with curriculum

**Files:**
- Backend: `Backend/routes/chatbot.js`
- Frontend: `Frontend/ai-assistant.html`
- AI Service: `AI Backend/main.py`

### 7. DASHBOARD & ANALYTICS

**Features:**
- 📊 Role-based dashboards
- 📈 Performance analytics
- 📈 Learning metrics
- 🏆 Leaderboards
- 📉 Detailed reports

**Files:**
- Backend: `Backend/routes/dashboard.js`
- Student: `Frontend/dashboard-live.html`
- Teacher: `Frontend/dashboard_v2.html`

### 8. USER MANAGEMENT

**Features:**
- 👥 User roles (Student, Teacher, Admin)
- 🔐 JWT authentication
- 🔒 Password hashing (bcryptjs)
- 🔄 Token refresh mechanism
- 👤 Profile management

**Files:**
- Backend: `Backend/routes/auth.js`, `Backend/routes/user-management.js`
- Frontend: `Frontend/Login.html`, `Frontend/signin.html`

---

## 📡 API DOCUMENTATION

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@acadly.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "student"
}

Response:
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "student@acadly.com",
    "role": "student"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@acadly.com",
  "password": "password123"
}

Response:
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "token": "new_jwt_token_here"
}
```

### Video Endpoints

#### Get All Videos
```http
GET /api/videos/playlist?category=javascript&limit=20

Response:
{
  "status": "success",
  "videos": [
    {
      "id": 1,
      "title": "Introduction to JavaScript",
      "description": "...",
      "url": "https://...",
      "duration": 1200,
      "category": "javascript",
      "xp_reward": 50,
      "thumbnail": "..."
    }
  ]
}
```

#### Upload Video
```http
POST /api/videos/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <video_file>
title: "My Video Title"
category: "javascript"
xp_reward: 50

Response:
{
  "status": "success",
  "video": { ... }
}
```

### Progress Endpoints

#### Save Watch Time
```http
POST /api/progress/save-watch-time
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "video_id": 5,
  "watch_time": 450,
  "duration": 1200
}

Response:
{
  "status": "success",
  "progress": 37.5,
  "saved_at": "2026-04-09T10:30:00Z"
}
```

#### Video Complete
```http
POST /api/progress/video-complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1,
  "video_id": 5
}

Response:
{
  "status": "success",
  "xp_earned": 50,
  "total_xp": 1250,
  "level_up": true,
  "new_level": 5
}
```

#### Get Continue Watching
```http
GET /api/progress/continue-watching?user_id=1

Response:
{
  "status": "success",
  "videos": [
    {
      "video_id": 3,
      "title": "...",
      "progress": 65,
      "last_watched": "2026-04-08T15:20:00Z"
    }
  ]
}
```

#### Get User Stats
```http
GET /api/progress/user-stats?user_id=1

Response:
{
  "status": "success",
  "stats": {
    "total_xp": 1250,
    "current_level": 5,
    "videos_watched": 12,
    "videos_completed": 8,
    "current_streak": 5,
    "best_streak": 21
  }
}
```

### Dashboard Endpoints

#### Get Dashboard Data (Student)
```http
GET /api/dashboard/student?user_id=1

Response:
{
  "status": "success",
  "dashboard": {
    "user_info": { ... },
    "stats": { ... },
    "continue_watching": [ ... ],
    "recent_achievements": [ ... ],
    "learning_path_progress": [ ... ]
  }
}
```

---

## 🎨 FRONTEND COMPONENTS

### Header & Navigation

```html
<!-- Responsive navbar with dark mode toggle -->
<nav class="navbar">
  <div class="logo">🎓 Acadly</div>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/dashboard-live.html">Dashboard</a></li>
    <li><a href="/library.html">Library</a></li>
    <li><a href="/ai-assistant.html">AI Assistant</a></li>
  </ul>
  <button class="dark-mode-toggle">🌙</button>
</nav>
```

### Video Player Component

```html
<!-- Advanced video player with sync manager -->
<div class="video-player">
  <video id="video" controls>
    <source src="path/to/video.mp4" type="video/mp4">
  </video>
  <div class="xp-counter">+25 XP</div>
  <div class="progress-bar">
    <div class="resume-marker">Resume here</div>
  </div>
</div>
```

### Dashboard Cards

```html
<!-- Stat cards with animations -->
<div class="stat-card">
  <div class="icon">🏆</div>
  <div class="stat-value">1,250</div>
  <div class="stat-label">Total XP</div>
</div>
```

### Modular CSS

All CSS is organized in `/Frontend/CSS/`:
- `variables.css` - Color, spacing, typography
- `responsive.css` - Media queries & breakpoints
- `components.css` - Reusable component styles
- `dark-mode.css` - Dark theme variables

---

## 📂 PROJECT STRUCTURE (DETAILED)

```
Acadly/
│
├── 📁 Backend/
│   ├── server.js                    # Main Express server
│   ├── package.json                 # NPM dependencies
│   ├── db_config.js                 # MySQL connection pool
│   ├── middleware_auth.js           # JWT authentication middleware
│   ├── setup-db.js                  # Database initialization
│   ├── test-mongo-connection.js     # MongoDB test utility
│   │
│   ├── 📁 config/
│   │   └── schema.sql               # MySQL table definitions
│   │
│   └── 📁 routes/                   # API endpoints
│       ├── auth.js                  # /api/auth/* routes
│       ├── user-management.js       # /api/users/* routes
│       ├── videos.js                # /api/videos/* routes (playlist, upload)
│       ├── progress.js              # /api/progress/* routes (XP, watch time)
│       ├── dashboard.js             # /api/dashboard/* routes
│       ├── pdf-library.js           # /api/pdfs/* routes
│       ├── models3d.js              # /api/models/* routes
│       ├── practicelab.js           # /api/labs/* routes (quizzes)
│       ├── roadmap.js               # /api/roadmap/* routes
│       ├── chatbot.js               # /api/chatbot/* routes
│       └── db.js                    # [DEPRECATED] Legacy DB config
│
├── 📁 Frontend/
│   ├── Homepage.html                # Landing page
│   ├── Login.html                   # Login form
│   ├── signin.html                  # Alternative signin page
│   │
│   ├── 📄 Dashboard Pages
│   │   ├── dashboard-live.html      # ⭐ Student live dashboard
│   │   └── dashboard_v2.html        # Teacher/admin dashboard
│   │
│   ├── 📄 Learning Pages
│   │   ├── videoplayer-live.html    # ⭐ Video player with auto-resume
│   │   ├── practicelab.html         # Quiz/practice lab
│   │   ├── roadmap.html             # Learning path
│   │   └── library.html             # PDF & resource library
│   │
│   ├── 📄 Utility Pages
│   │   ├── ai-assistant.html        # Chatbot interface
│   │   ├── 3d-lab.html              # 3D model viewer
│   │   ├── audiobook.html           # Audio learning
│   │   ├── flashcards.html          # Flashcard study
│   │   ├── blogs.html               # Blog directory
│   │   ├── blog-editor.html         # Blog editor
│   │   ├── mind-map.html            # Mind map tool
│   │   ├── timetable.html           # Schedule viewer
│   │   ├── contact.html             # Contact form
│   │   └── acadly_legal_hub.html    # Legal documents
│   │
│   ├── 📁 CSS/
│   │   ├── index.css                # Main stylesheet
│   │   ├── home.css                 # Homepage styles
│   │   ├── dark-mode.css            # Dark theme
│   │   ├── responsive.css           # Media queries
│   │   └── variables.css            # CSS variables
│   │
│   ├── 📁 js/
│   │   ├── sync-manager.js          # ⭐ Core sync logic
│   │   ├── video-metadata.js        # Video data & config
│   │   ├── library.js               # Library utilities
│   │   └── utils.js                 # Common utilities
│   │
│   ├── 📁 blogs/
│   │   ├── *.md                     # Blog posts (Markdown)
│   │   └── ...
│   │
│   ├── 📁 pdfs/
│   │   ├── lecture1.pdf
│   │   ├── notes.pdf
│   │   └── ...
│   │
│   ├── 📁 3d-models/
│   │   ├── molecule.glb
│   │   ├── dna.obj
│   │   └── ...
│   │
│   └── library.js                   # PDF library script
│
├── 📁 DataBase/
│   ├── db_config.js                 # MySQL connection (primary)
│   ├── db_config_mongo.js           # MongoDB connection
│   ├── schema.sql                   # Complete schema
│   ├── schema-mongo.js              # MongoDB schemas
│   ├── schema-enhanced.sql          # Extended schema
│   ├── dashboard_demo_seed.sql      # Demo data
│   ├── admin_middleware.js          # Admin auth
│   ├── admin_routes.js              # Admin endpoints
│   └── resolve-mongoose.js          # Mongoose utilities
│
├── 📁 AI Backend/
│   ├── main.py                      # Python AI service
│   ├── requirements.txt             # Python dependencies
│   └── README.md                    # AI setup guide
│
├── 📁 docker/
│   └── start-all.sh                 # Docker startup script
│
├── 📄 Configuration Files
│   ├── .env.example                 # Environment template
│   ├── .env                         # [GITIGNORED] Local config
│   ├── .gitignore                   # Git ignore rules
│   ├── package.json                 # Root dependencies
│   ├── docker-compose.yml           # Docker Compose config
│   ├── Dockerfile                   # Docker image
│   └── Makefile                     # Build automation
│
└── 📄 Documentation
    ├── README.md                    # Project overview (UPDATED)
    ├── WEBSITE_GUIDE.md             # ⭐ This file
    ├── QUICK_START_LIVE_TRACKING.md # Quick setup (2 min)
    ├── LIVE_TRACKING_SETUP.md       # Detailed setup
    ├── TECHNICAL_SUMMARY.md         # Architecture details
    ├── VERIFICATION_CHECKLIST.md    # Testing checklist
    ├── QUICK_REFERENCE.md           # Command reference
    ├── DATABASE_DESIGN_GUIDE.md     # DB documentation
    ├── MONGODB_SETUP.md             # MongoDB guide
    ├── VIDEO_UPLOAD_GUIDE.md        # Video upload help
    ├── SYSTEM_COMPLETE_SUMMARY.md   # Feature summary
    ├── VISUAL_REFERENCE.md          # Diagrams
    ├── SECURITY.md                  # Security guidelines
    ├── contributing.md              # Contribution guide
    ├── CODE_OF_CONDUCT.md           # Code of conduct
    └── LICENSE                      # MIT License
```

---

## �️ URL ROUTING & NAVIGATION GUIDE

### Correct Path Conventions

**⚠️ IMPORTANT:** Acadly uses different path styles for frontend and API:

#### Frontend Pages (Relative Paths)
- ✅ Correct: `href="videoplayer-live.html"`, `href="Login.html"`
- ❌ Wrong: `href="/videoplayer-live.html"`, `href="./videoplayer-live.html"`
- Directory structure is flat in `Frontend/` so no directory prefixes needed

#### API Calls (Absolute Paths)
- ✅ Correct: `fetch('/api/videos')`, `fetch('/api/dashboard/summary/1')`
- ❌ Wrong: `fetch('api/videos')`, `fetch('./api/videos')`
- All API calls must include leading `/`

### Frontend Navigation Map

```
Homepage (/)
├── [Sign In] → Login.html
├── [Log In] → Login.html
├── [Get Started] → Login.html?next=acadly_learning_path.html
├── [Study Modules] → (Card click) → Login.html?next=acadly_learning_path.html
├── [AI Chat] → ai-assistant.html
├── [Privacy/Terms] → acadly_legal_hub.html?tab=copyright|terms|feedback
└── [Contact] → contact.html

Dashboard (after login)
├── [Video Hub] → videoplayer-live.html?video=VIDEO_ID
├── [3D Models] → 3d-lab.html
├── [AI Chatbot] → ai-assistant.html
├── [Learning Path] → acadly_learning_path.html
├── [Practice Lab] → practicallab.html
├── [Flashcards] → flashcards.html
├── [Blogs] → blogs.html
├── [Library] → library.html
├── [Timetable] → timetable.html
├── [Mind Map] → mind-map.html
├── [Audiobook] → audiobook.html
└── [Logout] → Homepage (session cleared)

Learning Path (acadly_learning_path.html)
└── [Back to Dashboard] → dashboard-live.html

Video Player (videoplayer-live.html)
├── [Dashboard] → dashboard-live.html
├── [Next Video] → videoplayer-live.html?video=NEXT_ID
└── [Quiz] → (embedded in player or links to practicallab.html)

Blogs (blogs.html)
├── [Home] → Homepage.html
├── [Write Blog] → blog-editor.html
└── [View Post] → (embedded or links to post)

3D Lab (3d-lab.html)
├── [Upload] → 3d-upload.html
└── [Download Model] → (direct file download)

3D Upload (3d-upload.html)
└── [View Lab] → 3d-lab.html

Timetable (timetable.html)
├── [Home] → Homepage.html
├── [Dashboard] → dashboard_v2.html
├── [Learning Path] → acadly_learning_path.html
└── [AI Assistant] → ai-assistant.html
```

### Query Parameter Reference

| Page | Parameter | Value | Example |
|------|-----------|-------|---------|
| Login | `next` | Target page | `Login.html?next=videoplayer-live.html` |
| Video Player | `video` | Video ID | `videoplayer-live.html?video=5` |
| Legal Hub | `tab` | copyright\|terms\|feedback | `acadly_legal_hub.html?tab=terms` |
| Dashboard | `user` | User ID | `dashboard-live.html?user=1` |
| Learning Path | `course` | Course ID | `acadly_learning_path.html?course=101` |

### API Endpoint Directory

#### Authentication (`/api/auth/*`)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

#### Videos (`/api/videos/*`)
- `GET /api/videos/playlist` - List all videos
- `GET /api/videos/playlist?category=X` - Filter by category
- `POST /api/videos/upload` - Upload new video
- `GET /api/videos/featured` - Get featured videos

#### Progress (`/api/progress/*`)
- `POST /api/progress/save-watch-time` - Save video progress
- `POST /api/progress/video-complete` - Mark video complete
- `GET /api/progress/continue-watching` - Get resume list
- `GET /api/progress/user-stats` - Get user statistics
- `GET /api/progress/milestones` - Get achievements

#### Dashboard (`/api/dashboard/*`)
- `GET /api/dashboard/summary/:user_id` - Dashboard overview
- `GET /api/dashboard/profile/:user_id` - User profile data
- `GET /api/dashboard/analytics/:user_id` - Performance analytics
- `GET /api/dashboard/leaderboard` - Top performers

#### PDFs (`/api/pdfs/*`)
- `GET /api/pdfs/list` - List all PDFs
- `GET /api/pdfs/list?category=X` - Filter by category
- `POST /api/pdfs/upload` - Upload PDF
- `GET /api/pdfs/search?q=keyword` - Search PDFs

#### 3D Models (`/api/models/*`)
- `GET /api/models` - List all models
- `GET /api/models?category=X` - Filter by category
- `POST /api/models/upload` - Upload 3D model
- `GET /api/models/download/:id` - Download model

#### Practice Lab (`/api/ptl/*`)
- `GET /api/ptl/labs` - List available labs
- `POST /api/ptl/start` - Start lab session
- `GET /api/ptl/machines` - List machine labs
- `POST /api/ptl/complete-task` - Submit task/command
- `POST /api/ptl/submit-flag` - Submit flag answer

#### User Management (`/api/users/*`)
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id/password` - Change password

#### Roadmap (`/api/roadmap/*`)
- `GET /api/roadmap/paths` - List learning paths
- `GET /api/roadmap/progress/:user_id` - User path progress
- `POST /api/roadmap/progress` - Update path progress

---

## �🐛 TROUBLESHOOTING

### Server Won't Start

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
netstat -ano | findstr :3000    # Windows
lsof -i :3000                  # macOS/Linux

# Kill the process
taskkill /PID <PID> /F         # Windows
kill -9 <PID>                  # macOS/Linux

# Or use different port
PORT=3001 npm start
```

### MySQL Connection Failed

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Solution:**
```bash
# Verify MySQL is running
mysql -u root -p

# Start MySQL
# Windows: net start MySQL80
# macOS: brew services start mysql
# Linux: sudo systemctl start mysql

# Check .env credentials
cat .env | grep DB_

# Test connection
mysql -h localhost -u root -p acadly_db
```

### Database Not Initialized

**Problem:** `Error: Table 'acadly_db.users' doesn't exist`

**Solution:**
```bash
# Run setup script
node Backend/setup-db.js

# Or manually create database
mysql -u root -p
CREATE DATABASE acadly_db;
USE acadly_db;
source DataBase/schema.sql;
```

### Module Not Found

**Problem:** `Error: Cannot find module 'cookie-parser'`

**Solution:**
```bash
# Reinstall dependencies
cd Backend
rm -rf node_modules package-lock.json
npm install

# Check package.json for missing dependencies
npm list
```

### Videos Not Playing

**Problem:** Videos show 404 error

**Solution:**
```bash
# Verify video files exist
ls Frontend/pdfs/          # for PDFs
ls Frontend/3d-models/     # for 3D models

# Check MongoDB connection (for GridFS)
node Backend/test-mongo-connection.js

# Verify S3 credentials (if using AWS)
echo $AWS_ACCESS_KEY_ID
```

### Frontend Not Loading

**Problem:** Blank page or 404

**Solution:**
```bash
# Verify Frontend folder exists
ls Frontend/

# Check server is serving static files
curl http://localhost:3000/Homepage.html

# Verify Express is configured correctly
grep "FRONTEND_PATH" Backend/server.js
```

### Authentication Errors

**Problem:** `401 Unauthorized` on protected routes

**Solution:**
```bash
# Verify JWT token is being sent
Authorization: Bearer <token>

# Check token expiry
node -e "console.log(require('jsonwebtoken').decode('YOUR_TOKEN_HERE'))"

# Generate new token by logging in
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@acadly.com","password":"password123"}'
```

---

## 💻 DEVELOPMENT WORKFLOW

### Creating a New Feature

#### 1. Create Backend Route

Create file `Backend/routes/feature-name.js`:

```javascript
const express = require("express");
const router = express.Router();
const pool = require("../db_config");

// GET endpoint
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM table_name");
    res.json({ status: "success", data: rows });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// POST endpoint
router.post("/", async (req, res) => {
  try {
    const { data } = req.body;
    const [result] = await pool.query(
      "INSERT INTO table_name (column) VALUES (?)",
      [data]
    );
    res.json({ status: "success", id: result.insertId });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
```

#### 2. Register Route in Server

Edit `Backend/server.js`:

```javascript
// Add import
const featureRoutes = require("./routes/feature-name");

// Register route
app.use("/api/feature-name", featureRoutes);
```

#### 3. Create Frontend HTML

Create file `Frontend/feature-name.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Name - Acadly</title>
  <link rel="stylesheet" href="CSS/index.css">
</head>
<body>
  <div class="container">
    <h1>Feature Name</h1>
    <div id="content"></div>
  </div>

  <script>
    fetch('/api/feature-name')
      .then(res => res.json())
      .then(data => {
        document.getElementById('content').innerHTML = 
          '<p>' + JSON.stringify(data) + '</p>';
      });
  </script>
</body>
</html>
```

#### 4. Update Database Schema (if needed)

Edit `DataBase/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS feature_table (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  data VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Testing Guidelines

```bash
# Test API endpoints with curl
curl -X GET http://localhost:3000/api/videos/playlist

# Test with authentication
curl -X POST http://localhost:3000/api/progress/save-watch-time \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"video_id": 1, "watch_time": 50}'

# Test file uploads
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@video.mp4" \
  -F "title=My Video"
```

### Code Standards

**JavaScript:**
- Use const/let, not var
- Arrow functions preferred
- async/await over callbacks
- Comments for complex logic
- ISO 8601 timestamps

**HTML:**
- Semantic HTML5 tags
- Accessible forms (labels, ARIA)
- Mobile-first design
- Dark mode support

**CSS:**
- Tailwind CSS classes
- CSS variables for theming
- Mobile-first responsive
- Smooth animations

---

## 🚢 DEPLOYMENT

### Preparation Checklist

```bash
# 1. Update environment
NODE_ENV=production
PORT=3000

# 2. Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Set strong passwords
# Update DB_PASSWORD, JWT_SECRET, ADMIN_SECRET_KEY

# 4. Test production build
npm start

# 5. Verify all endpoints
curl http://localhost:3000/api/health

# 6. Check database
mysql -u root -p acadly_db -e "SELECT COUNT(*) FROM users;"
```

### Docker Deployment

```bash
# Build image
docker build -t acadly:v1.0 .

# Test locally
docker run -p 3000:3000 --env-file .env acadly:v1.0

# Push to registry
docker tag acadly:v1.0 myregistry/acadly:v1.0
docker push myregistry/acadly:v1.0

# Deploy
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment (Sample: AWS)

```bash
# 1. Create EC2 instance
# 2. SSH into instance
# 3. Clone repository
git clone https://github.com/pranitdhanade-sys/Acadly.git

# 4. Install dependencies
cd Acadly/Backend
npm install --production

# 5. Set environment variables
nano /etc/environment

# 6. Start with PM2
npm install -g pm2
pm2 start server.js --name "acadly"
pm2 startup
pm2 save

# 7. Configure reverse proxy (Nginx)
# Nginx config sample:
# server {
#   listen 80;
#   server_name acadly.com;
#   location / {
#     proxy_pass http://localhost:3000;
#   }
# }

# 8. Enable SSL (Let's Encrypt)
certbot certonly --nginx -d acadly.com
```

---

## 📞 SUPPORT & RESOURCES

### Documentation Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Project overview |
| [QUICK_START_LIVE_TRACKING.md](./QUICK_START_LIVE_TRACKING.md) | 2-minute setup |
| [LIVE_TRACKING_SETUP.md](./LIVE_TRACKING_SETUP.md) | Detailed setup guide |
| [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md) | Database architecture |
| [TECHNICAL_SUMMARY.md](./TECHNICAL_SUMMARY.md) | Technical details |
| [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) | Testing checklist |

### Common Commands Reference

```bash
# Server
npm start              # Production
npm run dev            # Development (nodemon)

# Database
node Backend/setup-db.js              # Initialize DB
mysql -u root -p acadly_db            # Connect to MySQL
mongo "mongodb://localhost/acadly"    # Connect to MongoDB

# Code Quality
npm test               # Run tests (if configured)
npm run lint          # Run linter (if configured)

# Logs
pm2 logs              # View PM2 logs
tail -f /var/log/app.log  # View app logs

# Environment
env | grep DB_        # Show DB env vars
env | grep JWT_       # Show JWT env vars
```

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] Node.js installed (v18+)
- [ ] npm dependencies installed
- [ ] .env file created with correct values
- [ ] MySQL running and database created
- [ ] Backend server starts without errors
- [ ] Homepage loads at http://localhost:3000
- [ ] Can login with test credentials
- [ ] Dashboard shows live data
- [ ] Video player loads & auto-resumes
- [ ] XP counter updates on video completion
- [ ] Database records update in real-time
- [ ] API endpoints respond with 200 status
- [ ] Dark mode toggle works
- [ ] Mobile responsive design works
- [ ] All pages load without 404 errors

---

## 📝 NOTES

### Known Issues

- [ ] Admin routes require additional configuration
- [ ] MongoDB integration is optional (works without it)
- [ ] Email functionality requires SMTP setup
- [ ] S3 storage requires AWS credentials

### Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Payment integration
- [ ] Live class streaming

---

## 📅 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| **2.0** | Apr 2026 | Live tracking, auto-resume, XP system ✅ |
| **1.5** | Mar 2026 | Dashboard redesign, PDF library |
| **1.0** | Jan 2026 | Initial release |

---

## 📧 CONTACT & CONTRIBUTION

- **GitHub:** [Acadly Repository](https://github.com/pranitdhanade-sys/Acadly)
- **Issues:** Report bugs on GitHub Issues
- **Contributing:** See [contributing.md](./contributing.md)
- **Code of Conduct:** See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

---

**Last Updated:** April 9, 2026  
**Maintained By:** Acadly Development Team  
**License:** MIT - See [LICENSE](./LICENSE)

🎓 **Happy Learning with Acadly!** 🎓
