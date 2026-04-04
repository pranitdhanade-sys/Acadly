---
name: Acadly Workspace Instructions
description: |
  Guidance for AI agents working in the Acadly academic management platform.
  Use when: asking about project setup, architecture, coding patterns, debugging, or feature development.
---

# Acadly Workspace Instructions

Acadly is a full-stack academic management system with a Node.js/Express backend, Vanilla HTML/JS frontend, and MySQL database. This document guides AI agents on project conventions, common issues, and best practices.

## Quick Start for Development

### One-Time Setup
```bash
# 1. Install backend dependencies
cd Backend && npm install

# 2. Create .env file in project root
# Copy template below and fill in credentials
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=acadly_db
PORT=3000
NODE_ENV=development

# 3. Initialize MySQL database (seeds sample data)
node Backend/setup-db.js

# 4. Start development server
npm start
# Open http://localhost:3000
```

### Daily Development
```bash
cd Backend && npm start          # Runs server with nodemon auto-reload
# Edit Frontend/*.html directly—changes auto-serve without restart
```

See [Setup Guide](./DataBase/README.md) for detailed database configuration.

---

## Project Architecture

### Technology Stack
| Layer | Tech | Key Files |
|-------|------|-----------|
| **Frontend** | HTML5, Vanilla JS, Tailwind CSS | `Frontend/index.html`, `Frontend/js/video-metadata.js` |
| **Backend** | Node.js, Express 5.2.1 | `Backend/server.js`, `Backend/routes/*.js` |
| **Database** | MySQL | `DataBase/schema.sql`, `DataBase/seed_videos.sql` |
| **Config** | dotenv | `.env` (required; create manually) |

### Folder Structure
```
Backend/
  ├── server.js              # Express entry point (serves Frontend, registers routes)
  ├── setup-db.js            # DB initialization (run once)
  ├── package.json           # Dependencies
  ├── config/schema.sql      # Minimal DB schema (incomplete)
  └── routes/
      ├── videos.js          # GET /api/videos (playlist, quiz retrieval)
      ├── progress.js        # POST /api/progress (XP, video completion tracking)
      ├── dashboard.js       # GET /api/dashboard (student/admin stats)
      ├── chatbot.js         # [STUB—empty, not wired]
      └── db.js              # Direct MySQL connection [LEGACY—use DataBase/db_config.js instead]

Frontend/
  ├── index.html             # Home/landing (link hub to other pages)
  ├── dashboard.html         # Role-based dashboard (2 versions available)
  ├── videoplayer.html       # Video player + quiz interface
  ├── chatbot.html           # AI assistant UI (backend route stubbed)
  ├── Login.html / signin.html
  ├── js/video-metadata.js   # Video data, quiz questions, XP multipliers
  ├── public/home.css        # Tailwind + dark mode styles
  └── [Root HTML landing pages]
      ├── acadly_learning_path.html
      ├── acadly_legal_hub.html
      ├── ai-assistant.html

DataBase/
  ├── schema.sql             # Comprehensive schema (8+ tables)
  ├── seed_videos.sql        # Sample videos + learning content
  ├── db_config.js           # MySQL promise pool [PREFERRED]
  ├── db.js (Backend/routes/)  # Direct connection [LEGACY]
  ├── admin_routes.js        # [INCOMPLETE]
  └── admin_middleware.js    # [INCOMPLETE]
```

---

## Key Conventions & Patterns

### Backend Code Style
- **Middleware stack order:** CORS → JSON parsing → Static files → Routes → Error handler
- **Route naming:** RESTful (`/api/videos`, `/api/progress`), not RPC-style
- **Error handling:** Graceful degradation; missing auth routes fail silently
- **Database:** Use `DataBase/db_config.js` (promise-based pool), not `routes/db.js` (legacy callbacks)
- **Config:** All credentials from `.env` with fallback defaults in server.js

### Database Naming
- **Tables:** Lowercase with underscores (`user_profiles`, `videos)
- **Columns:** Camelcase in code, snake_case in SQL (`user_id`, `created_at`)
- **Timestamps:** All tables have `created_at`/`updated_at`
- **Primary Key:** Auto-increment `id`, foreign keys use `ON DELETE CASCADE`

### Frontend Code Style
- **HTML files:** No framework routing; links reload pages or navigate via `<a>` tags
- **JavaScript:** Vanilla JS; event-driven (no React/Vue despite README mismatch)
- **Data storage:** localStorage for user prefs, fetch() for API calls
- **Styling:** Tailwind CSS + dark mode toggle in `public/home.css`

### Gamification (XP System)
- Located in `Frontend/js/video-metadata.js` and `Backend/routes/progress.js`
- Videos have variable XP rewards; tracked per user in `user_profiles.experience_points`
- Milestone bonuses exist for streaks/completion rates

---

## Known Issues & Incomplete Features

### ⚠️ High Priority
1. **Documentation mismatch:** README claims React/Next.js, but code is Vanilla HTML/JS
   - *Action:* Update README to reflect actual tech stack
2. **Empty chatbot route:** `Backend/routes/chatbot.js` is stubbed
   - *Action:* Wire up chatbot logic before feature development
3. **Dual DB configs:** Both `DataBase/db_config.js` (preferred) and `Backend/routes/db.js` (legacy)
   - *Action:* Consolidate; move all routes to use `db_config.js`, deprecate `routes/db.js`
4. **No password hashing:** Schema says "use bcrypt in production" but not implemented
   - *Action:* Add bcrypt to package.json and implement before production

### 📝 Medium Priority
- `admin_routes.js` and `admin_middleware.js` exist but are unused; purpose unclear
- Auth routes fail silently; no JWT implementation visible (README mentions as planned)
- No test framework (`package.json` has dummy test command)
- No CI/CD pipeline or GitHub Actions configured
- Makefile and docker-compose.yml are empty/minimal; not active

### 🔧 Environment & Setup
- `.env` file must be created manually; no `.env.example` provided
- MySQL must run locally or via XAMPP; connection hardcoded to `localhost:3306`
- Requires Node.js v18+ and MySQL

---

## Development Workflow

### When Starting Work On...

**A new API endpoint:**
1. Create route file in `Backend/routes/` following RESTful pattern
2. Import `db_config.js` for database queries (not `db.js`)
3. Test with `curl` or Postman
4. Update Frontend HTML to call new endpoint via `fetch()`
5. Add to this guidance if introducing new conventions

**A frontend page or UI component:**
1. Create `.html` file in `Frontend/` or modify existing one
2. Use Tailwind CSS classes; add dark mode support
3. Store dynamic data in `Frontend/js/video-metadata.js` if needed
4. Link from `index.html` or relevant pages
5. Ensure responsive design (test on mobile)

**A database schema change:**
1. Update `DataBase/schema.sql` with new tables/columns
2. Update `DataBase/seed_videos.sql` if adding sample data
3. Document breaking changes in PR comments
4. Run `node Backend/setup-db.js` to test locally
5. Coordinate with backend routes that query the schema

**Bug fixes or refactoring:**
1. Always check the known issues list above first
2. Use `DataBase/db_config.js` for new DB queries
3. Test locally before committing
4. Update documentation if behavior changes

---

## Important Files to Know

| File | Purpose | When to Use |
|------|---------|-----------|
| [Backend/server.js](./Backend/server.js) | Express app setup, middleware chain, route registration | Understanding server startup or adding global middleware |
| [Frontend/js/video-metadata.js](./Frontend/js/video-metadata.js) | Video data, quiz content, XP multipliers | Adding/editing videos or gamification logic |
| [DataBase/schema.sql](./DataBase/schema.sql) | Complete DB schema definition | Adding tables or columns, understanding data model |
| [DataBase/db_config.js](./DataBase/db_config.js) | MySQL promise pool (preferred) | Creating new database queries |
| [Backend/routes/videos.js](./Backend/routes/videos.js) | Video API logic | Understanding playlist/quiz retrieval |
| [Backend/routes/progress.js](./Backend/routes/progress.js) | XP tracking and video completion | Understanding gamification |
| [README.md](./README.md) | Project overview (note: tech stack mismatch) | Onboarding; update section on tech stack |
| [DataBase/README.md](./DataBase/README.md) | Database setup details | Database configuration troubleshooting |

---

## Anti-Patterns to Avoid

❌ **Do NOT:**
- Use `Backend/routes/db.js` directly—use `DataBase/db_config.js` instead
- Hardcode database credentials in source files; use `.env`
- Create new authentication logic without coordinating on JWT/session strategy
- Skip Tailwind styling in favor of inline `<style>` tags
- Forget to add `created_at`/`updated_at` timestamps to new tables
- Ignore the "Known Issues" section when planning features

✅ **DO:**
- Check `.env` for all config before assuming defaults
- Use `fetch()` with proper error handling on frontend
- Document new routes in this guidance file
- Test database operations locally before pushing
- Use snake_case in SQL, camelCase in JavaScript
- Link to existing docs instead of duplicating

---

## Links & References

- **Community:** [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) | [SECURITY.md](./SECURITY.md)
- **Development:** [DataBase/README.md](./DataBase/README.md) (setup guide)
- **Main Docs:** [README.md](./README.md) (overview; note tech stack mismatch)
- **Contributing:** [contributing.md](./contributing.md) (expand this)

---

**Last Updated:** April 2026  
**Maintained By:** Development Team  
**Questions?** See [SECURITY.md](./SECURITY.md) for contact info.
