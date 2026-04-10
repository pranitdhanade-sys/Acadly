# 📚 Acadly Platform - Master Documentation Index

**Complete documentation reference for developers, designers, and project managers**

---

## 📖 Documentation Files Overview

### 🎯 Start Here

| Document | Purpose | Best For |
|----------|---------|----------|
| **[README.md](./README.md)** | Project overview & quick start | Getting started quickly |
| **[WEBSITE_GUIDE.md](./WEBSITE_GUIDE.md)** | Comprehensive platform guide | Understanding full system |
| **[BACKEND_SETUP.md](./Backend/README.md)** | Backend API & server configuration | Backend developers |
| **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** | Frontend structure & components | Frontend developers |
| **[PDF-Hub-Frontend/README.md](./PDF-Hub-Frontend/README.md)** | PDF library documentation | PDF feature developers |

---

## 🏗️ Architecture & Design

### System Architecture

**Read First:** [WEBSITE_GUIDE.md - Architecture Section](./WEBSITE_GUIDE.md#-architecture)

**Then Read:**
- [SYSTEM_COMPLETE_SUMMARY.md](./SYSTEM_COMPLETE_SUMMARY.md) - Complete system overview
- [ARCHITECTURE_VERIFICATION_REPORT.md](./ARCHITECTURE_VERIFICATION_REPORT.md) - Architecture verification details
- [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md) - Database schema & relationships

### Data Flow

```
User Input (Frontend)
    ↓
API Request (HTTP/REST)
    ↓
Express Server (Backend)
    ↓
Database Query (MySQL/MongoDB)
    ↓
Data Processing
    ↓
Response (JSON)
    ↓
Frontend Rendering
    ↓
User Display
```

---

## 🎨 Frontend Documentation

### Pages & Components

**Main Landing Pages:**
- [Homepage.html](./Frontend/Homepage.html) - Central hub
- [Dashboard Pages](./Frontend/dashboard_v2.html) - Analytics & progress
- [Video Player](./Frontend/videoplayer-live.html) - Learning interface

**Feature Modules:**
- [PDF Library](./Frontend/library.html) - Document management
- [Learning Roadmap](./Frontend/roadmap.html) - Learning paths
- [3D Lab](./Frontend/3d-lab.html) - Interactive 3D models
- [AI Assistant](./Frontend/ai-assistant.html) - Chatbot interface
- [Audiobooks](./Frontend/audiobook.html) - Audio content
- [Blogs](./Frontend/blogs.html) - Blog reader

**See:** [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)

### Frontend Technologies

- **HTML5** - Semantic markup
- **Vanilla JavaScript** - ES6+ no frameworks
- **Tailwind CSS** - Utility-first styling
- **Dark Mode** - Theme switching
- **Responsive Design** - Mobile-first

---

## 🔌 Backend API Documentation

### API Routes

**Video Module:**
```
GET    /api/videos              # List all videos
GET    /api/videos/:id          # Video details
GET    /api/videos/:id/stream   # Stream video (range request)
POST   /api/videos              # Upload (admin)
DELETE /api/videos/:id          # Delete (admin)
```

**Progress Tracking:**
```
GET    /api/progress/:userId    # User progress
POST   /api/progress            # Log interaction
```

**Dashboard:**
```
GET    /api/dashboard           # User dashboard
GET    /api/dashboard/stats     # User statistics
```

**PDF Library:**
```
GET    /api/pdfs                # List PDFs
GET    /api/pdfs/:id/stream     # Stream PDF
POST   /api/pdfs                # Upload
```

**See:** [WEBSITE_GUIDE.md - Backend API Section](./WEBSITE_GUIDE.md#-backend-api)

---

## 💾 Database Documentation

### Database Setup

**Main Database:** MySQL

**Schema Files:**
- [DataBase/schema.sql](./DataBase/schema.sql) - Core schema
- [DataBase/schema-enhanced.sql](./DataBase/schema-enhanced.sql) - Enhanced schema
- [DataBase/schema-mongo.js](./DataBase/schema-mongo.js) - MongoDB schema

**Sample Data:**
- [DataBase/seed_videos.sql](./DataBase/seed_videos.sql) - Video samples
- [DataBase/dashboard_demo_seed.sql](./DataBase/dashboard_demo_seed.sql) - Dashboard data

### Key Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `users` | User accounts | N/A |
| `videos` | Video metadata | 20+ samples |
| `progress` | User progress | Auto-generated |
| `user_profiles` | User data | Auto-created |
| `pdfs` | PDF documents | On-demand |
| `quizzes` | Quiz questions | 50+ samples |
| `blogs` | Blog posts | 15+ samples |
| `3d_models` | 3D models | 10+ samples |

**See:** [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md)

---

## 📝 Feature Documentation

### Videos & Learning

- **Video PlayerGuide:** [QUICK_START_VIDEO_UPLOAD.md](./QUICK_START_VIDEO_UPLOAD.md)
- **Streaming:** [VIDEO_UPLOAD_GUIDE.md](./VIDEO_UPLOAD_GUIDE.md)
- **MongoDB Setup:** [MONGODB_VIDEO_STREAMING_SETUP.md](./MONGODB_VIDEO_STREAMING_SETUP.md)

### File Management

- **PDF Library:** [PDF-Hub-Frontend/README.md](./PDF-Hub-Frontend/README.md)
- **File Upload:** See Backend/routes/pdfs.js

### Real-Time Features

- **Live Tracking:** [QUICK_START_LIVE_TRACKING.md](./QUICK_START_LIVE_TRACKING.md)
- **Live Dashboard:** [LIVE_TRACKING_SETUP.md](./LIVE_TRACKING_SETUP.md)

---

## 🚀 Deployment & DevOps

### Docker

**Files:**
- [Dockerfile](./Dockerfile) - Container image
- [docker-compose.yml](./docker-compose.yml) - Service orchestration
- [docker/start-all.sh](./docker/start-all.sh) - Startup script

**Commands:**
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Installation & Setup

**See:** [WEBSITE_GUIDE.md - Quick Start Section](./WEBSITE_GUIDE.md#-quick-start)

**Steps:**
1. Clone repository
2. Install Node dependencies
3. Create .env file
4. Setup MySQL database
5. Run Backend/setup-db.js
6. Start npm start

---

## 🔐 Security & Configuration

### Environment Configuration

**File:** `.env` (create from `.env.example`)

**Key Variables:**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=acadly_db
JWT_SECRET=***
PORT=3000
```

**See:** [WEBSITE_GUIDE.md - Environment Variables](./WEBSITE_GUIDE.md#-environment-variables)

### Security Guidelines

**See:** [SECURITY.md](./SECURITY.md)

- Authentication best practices
- Data protection
- Password hashing
- API security
- CORS configuration

---

## 🧪 Testing & Verification

### Test Verification

**Reports:**
- [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - System verification
- [PATH_FIXES_SUMMARY.md](./PATH_FIXES_SUMMARY.md) - Path fixes log

### Quick Reference

**See:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

- Common commands
- File locations
- Troubleshooting tips
- Quick fixes

---

## 📚 Additional Resources

### Project Documentation

| File | Contains |
|------|----------|
| [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | Community guidelines |
| [contributing.md](./contributing.md) | Contribution process |
| [LICENSE](./LICENSE) | MIT License |

### Technical References

| File | Topic |
|------|-------|
| [TECHNICAL_SUMMARY.md](./TECHNICAL_SUMMARY.md) | Technical overview |
| [VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md) | UI/UX reference |
| [WEBSITE_GUIDE.md](./WEBSITE_GUIDE.md) | Complete platform guide |

### Setup Guides

| File | Purpose |
|------|---------|
| [MONGODB_SETUP.md](./MONGODB_SETUP.md) | MongoDB installation |
| [QUICK_START_LIVE_TRACKING.md](./QUICK_START_LIVE_TRACKING.md) | Live tracking setup |
| [QUICK_START_VIDEO_UPLOAD.md](./QUICK_START_VIDEO_UPLOAD.md) | Video upload configuration |

---

## 📊 Document Map

### By Role

**For Frontend Developers:**
1. Read: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)
2. Code: [Frontend/](./Frontend/) files
3. Reference: [VISUAL_REFERENCE.md](./VISUAL_REFERENCE.md)

**For Backend Developers:**
1. Read: [Backend/README.md](./Backend/README.md)
2. Code: [Backend/routes/](./Backend/routes/) files
3. Reference: [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md)

**For Full-Stack Setup:**
1. Read: [README.md](./README.md)
2. Follow: [WEBSITE_GUIDE.md - Quick Start](./WEBSITE_GUIDE.md#-quick-start)
3. Verify: [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)

**For DevOps/Deployment:**
1. Read: [Dockerfile](./Dockerfile)
2. Use: [docker-compose.yml](./docker-compose.yml)
3. See: [WEBSITE_GUIDE.md - Deployment](./WEBSITE_GUIDE.md#-deployment)

**For Database Work:**
1. Study: [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md)
2. Use: [DataBase/schema.sql](./DataBase/schema.sql)
3. Reference: [WEBSITE_GUIDE.md - Database](./WEBSITE_GUIDE.md#-database)

---

## 🎯 Common Tasks

### I want to...

**...add a new video module**
- See: [QUICK_START_VIDEO_UPLOAD.md](./QUICK_START_VIDEO_UPLOAD.md)
- Code: [Backend/routes/videos.js](./Backend/routes/videos.js)

**...create a new frontend page**
- See: [FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md#-development-workflow)
- Example: Follow [Frontend/Homepage.html](./Frontend/Homepage.html) structure

**...modify the database**
- See: [DATABASE_DESIGN_GUIDE.md](./DATABASE_DESIGN_GUIDE.md)
- Edit: [DataBase/schema.sql](./DataBase/schema.sql)
- Run: `node Backend/setup-db.js`

**...deploy to production**
- See: [WEBSITE_GUIDE.md - Deployment](./WEBSITE_GUIDE.md#-deployment)
- Use: Docker Compose or Cloud Platform

**...troubleshoot an issue**
- See: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common fixes
- Check: [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md)
- Review: Logs in `Backend/logs/` folder

---

## 🔄 Information Flow

```
START HERE
    ↓
[README.md] ← Quick overview
    ↓
CHOOSE YOUR PATH
    ├→ Frontend Dev? → [FRONTEND_ARCHITECTURE.md]
    ├→ Backend Dev? → [Backend/README.md]
    ├→ DevOps? → [Dockerfile, docker-compose.yml]
    └→ Full Setup? → [WEBSITE_GUIDE.md]
    ↓
[DATABASE_DESIGN_GUIDE.md] ← Understand data
    ↓
[VERIFICATION_CHECKLIST.md] ← Test everything
    ↓
[WEBSITE_GUIDE.md] ← Reference guide
    ↓
CODE & BUILD ✅
```

---

## 📞 Getting Help

### Documentation Structure

**Level 1 (Quick Start):**
- README.md (2-3 min read)
- QUICK_REFERENCE.md (reference)

**Level 2 (Understanding):**
- WEBSITE_GUIDE.md (comprehensive)
- FRONTEND_ARCHITECTURE.md (frontend deep-dive)
- Backend/README.md (backend deep-dive)

**Level 3 (Implementation):**
- Individual feature docs (VIDEO_UPLOAD_GUIDE.md, etc.)
- Source code files with inline comments
- Database schema documentation

### Support

- 📧 Email: support@acadly.com
- 💬 Discord: [Join Community]
- 🐛 Issues: GitHub Issues
- 📖 Wiki: [Project Wiki]

---

## 🎓 Learning Path

### New Team Members

**Week 1: Fundamentals**
1. Read README.md
2. Read WEBSITE_GUIDE.md
3. Run local setup (follow QUICK_START)
4. Explore codebase

**Week 2: Your Specialization**
- Frontend: Study FRONTEND_ARCHITECTURE.md + Frontend files
- Backend: Study Backend/README.md + API routes
- DevOps: Study docker files + deployment guide

**Week 3: Feature Development**
- Pick a feature from WEBSITE_GUIDE.md
- Study relevant documentation
- Implement & test

**Week 4+: Contribution**
- Create new features
- Fix issues
- Review PRs

---

## 📈 Document Maintenance

**Last Updated:** April 2024  
**Maintained By:** Acadly Development Team  
**Version:** 2.0

**Contributing to Docs:**
1. Update relevant .md file
2. Update this index if needed
3. Commit with clear message
4. Create PR for review

---

## 📄 Quick Links

### Essential Files
- [.env.example](./.env.example) - Environment template
- [package.json](./package.json) - Dependencies
- [docker-compose.yml](./docker-compose.yml) - Docker setup

### Database Files
- [schema.sql](./DataBase/schema.sql) - Database schema
- [seed_videos.sql](./DataBase/seed_videos.sql) - Sample data

### Frontend Files
- [Homepage.html](./Frontend/Homepage.html) - Main page
- [videoplayer-live.html](./Frontend/videoplayer-live.html) - Video player

### Backend Files
- [server.js](./Backend/server.js) - Express server
- [routes/videos.js](./Backend/routes/videos.js) - Video API
- [db_config.js](./Backend/db_config.js) - Database config

---

**For the most current information, always check the specific documentation file for your task.**

*Happy Coding! 🚀*
