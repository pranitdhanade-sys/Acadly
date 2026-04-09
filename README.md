# Acadly 🎓

### Modern Academic Management System

**Acadly** is a high-performance, full-stack academic management solution designed to streamline institutional workflows, enhance collaboration between educators and students, and centralize all academic operations into a unified digital platform. It minimizes administrative overhead while maximizing productivity, transparency, and accessibility across the entire education lifecycle.

---

## 🌟 Key Features

### 📊 Smart Attendance

Automated attendance tracking with one-click marking, real-time syncing, and detailed monthly analytics reports for both faculty and administration.

### 📂 Dynamic Resource Hub

A centralized cloud-based repository for lecture notes, syllabus documents, recorded lectures, and multimedia resources, accessible anytime.

### 📝 Assignment Pipeline

Complete lifecycle management for assignments including creation, submission, deadline tracking, evaluation, and optional automated grading systems.

### 📈 Unified Dashboard

Role-based dashboards providing personalized insights:

* **Students:** GPA tracking, attendance stats, schedules, assignments
* **Faculty:** Class performance analytics, attendance summaries, workload overview

### 🛠️ Admin Control Panel

Full institutional control including student enrollment, faculty assignment, course structuring, and academic scheduling.

---

## 💻 Tech Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| **Frontend**   | HTML5, Vanilla JavaScript, Tailwind CSS     |
| **Backend**    | Node.js (v18+), Express.js (v5.1+)         |
| **Database**   | MySQL 8+ (Primary), MongoDB (GridFS videos)|
| **Auth**       | JSON Web Tokens (JWT), bcryptjs             |
| **CSS**        | Dark theme, Glass morphism, Animations      |
| **Deployment** | Docker, Docker Compose, Self-hosted ready  |

---

## 🚀 Getting Started

### 🔧 Prerequisites

* **Node.js** (v18.0.0 or higher)
* **MySQL** 8+ (Local or Docker)
* **npm** package manager
* (Optional) **MongoDB** for video streaming features
* (Optional) **Docker & Docker Compose**

---

### ⚙️ Installation

See **[DataBase/README.md](./DataBase/README.md)** for complete setup instructions.

#### Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/pranitdhanade-sys/Acadly.git
cd Acadly

# 2. Install backend dependencies
cd Backend && npm install

# 3. Create .env file in project root
# Copy from .env.example and fill in your values
cp ../.env.example ../.env

# 4. Initialize and seed the database
node setup-db.js

# 5. Start the development server
npm start
# Server runs at http://localhost:3000
```

#### Environment Configuration

If `.env` doesn't exist, create it in the project root with:

```env
# Server
PORT=3000
NODE_ENV=development

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=acadly_db

# JWT Authentication
JWT_SECRET=your_long_random_secret_minimum_32_chars
JWT_REFRESH_SECRET=your_refresh_secret

# MongoDB (optional, for video streaming)
MONGO_URI=mongodb://localhost:27017/acadly_videos

# CORS & Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### 4. Start Development Server

```bash
# From Backend directory
npm start

# or use nodemon for auto-reload during development
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 🗺️ URL Routes & Navigation

### Frontend Pages (All relative paths)

| Page | Path | Purpose |
| --- | --- | --- |
| Home | `/` or `/Homepage.html` | Landing page |
| Login | `/Login.html` | User authentication |
| Dashboard | `/dashboard-live.html` | Main dashboard (live updates) |
| Video Player | `/videoplayer-live.html` | Video streaming & resume |
| AI Chat | `/ai-assistant.html` | AI chatbot assistant |
| Learning Path | `/acadly_learning_path.html` | Structured learning roadmap |
| Practice Lab | `/practicallab.html` | Lab tasks & challenges |
| 3D Models | `/3d-lab.html` | 3D model viewer |
| Model Upload | `/3d-upload.html` | Upload 3D models |
| Blogs | `/blogs.html` | Blog listing |
| Blog Editor | `/blog-editor.html` | Write & manage blogs |
| Resource Library | `/library.html` | PDF & resource library |
| Contact | `/contact.html` | Contact form |

### API Endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/users/*` | GET/POST | User profile & management |
| `/api/videos` | GET | Fetch video lists |
| `/api/videos/upload` | POST | Upload videos |
| `/api/pdfs` | GET/POST | PDF library management |
| `/api/models` | GET | 3D model listing |
| `/api/models/upload` | POST | Upload 3D models |
| `/api/progress/*` | POST | Track learning progress & XP |
| `/api/dashboard/*` | GET | Dashboard statistics |
| `/api/roadmap/*` | GET/POST | Learning path progress |
| `/api/ptl/*` | GET/POST | Practice lab endpoints |

### Important Notes on Paths

⚠️ **ALL HTML file links use relative paths** (no leading `/`):  
✓ Correct: `href="ai-assistant.html"`, `href="Login.html"`  
❌ Wrong: `href="/ai-assistant.html"`, `href="../ai-assistant.html"`

⚠️ **API calls use absolute paths** (with leading `/`):  
✓ Correct: `fetch('/api/videos')`, `fetch('/api/dashboard/summary')`  
❌ Wrong: `fetch('api/videos')`, `fetch('./api/videos')`

---

## 🏗️ Project Structure

```
Acadly/
├── Backend/                    # Node.js/Express backend
│   ├── server.js              # Main server entry point
│   ├── package.json           # Backend dependencies
│   ├── db_config.js           # MySQL connection pool
│   ├── setup-db.js            # Database initialization script
│   └── routes/                # API endpoints
│       ├── auth.js            # Authentication routes
│       ├── videos.js          # Video/playlist routes
│       ├── progress.js        # XP & progress tracking
│       ├── dashboard.js       # Dashboard data
│       ├── pdf-library.js     # PDF library routes
│       ├── models3d.js        # 3D model routes
│       └── ...               # Other route files
│
├── Frontend/                   # Vanilla HTML/CSS/JS frontend
│   ├── Homepage.html          # Landing page
│   ├── dashboard-live.html    # Live dashboard
│   ├── videoplayer-live.html  # Video player with resume
│   ├── Login.html             # Login page
│   ├── signup.html            # Registration page
│   ├── practicelab.html       # Practice lab/quiz interface
│   ├── library.html           # PDF/resource library
│   ├── 3d-lab.html            # 3D model viewer
│   ├── ai-assistant.html      # AI chatbot interface
│   ├── CSS/                   # Stylesheets (Tailwind)
│   ├── js/                    # JavaScript modules
│   │   ├── sync-manager.js    # Live progress sync
│   │   └── ...
│   └── blogs/                 # Blog markdown files
│
├── DataBase/                   # Database configurations
│   ├── db_config.js           # MySQL pool (main)
│   ├── db_config_mongo.js     # MongoDB connection
│   ├── schema.sql             # MySQL schema
│   ├── schema-mongo.js        # MongoDB schemas
│   └── ...
│
├── AI Backend/                 # Python ML/AI services
│   ├── main.py                # AI service entry
│   └── requirements.txt        # Python dependencies
│
├── .env.example               # Environment variables template
├── package.json               # Root dependencies
├── docker-compose.yml         # Docker composition
├── Dockerfile                 # Docker image
└── README.md                  # This file
```
├── server/              # Node.js backend
│   ├── models/          # Database schemas (Mongoose)
│   ├── controllers/     # Business logic layer
│   ├── routes/          # API endpoints
│   └── middleware/      # Auth & request processing
│
├── .env                 # Environment variables
├── package.json         # Project dependencies
└── README.md            # Documentation
```

---

## 🔐 Authentication Flow

* User registers/logs in
* Backend validates credentials
* JWT token is issued
* Token is used for protected API access
* Role-based authorization applied

---

## ⚡ Performance & Scalability

* Optimized API structure using Express middleware
* Efficient MongoDB queries via indexing
* Lazy loading and SSR with Next.js
* Containerized deployment support with Docker

---

## 🤝 Contributing

Contributions are welcome and encouraged.

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add NewFeature"
```

4. Push to your branch

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👤 Author

**Pranit Dhanade**

* GitHub: https://github.com/pranitdhanade-sys
* Focus: Full-Stack Engineering | Robotics | Cybersecurity

---

## ❤️ Vision

Acadly aims to transform traditional education systems into intelligent, automated, and scalable digital ecosystems that empower both educators and learners with modern tools and seamless experiences.
