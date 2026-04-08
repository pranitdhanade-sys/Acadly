# Acadly Website Functioning — Complete Technical Wiki

## 1) System Overview

Acadly is structured as a hybrid monolith:

- **Server runtime:** Node.js + Express.
- **Frontend delivery:** static files from `Frontend/` served directly by Express.
- **Primary relational data:** MySQL (`users`, attendance, assignments, profile, KPI/dashboard tables).
- **Binary media/document storage:** MongoDB GridFS (videos and PDFs), with metadata in Mongo collections.

At startup, the backend:

1. Loads environment variables from root `.env`.
2. Initializes middleware (`cors`, JSON/body parsing).
3. Serves `Frontend` as static web root.
4. Attempts MySQL and MongoDB initialization.
5. Mounts API route groups.
6. Adds page aliases (`/`, `/home`, `/blogs`, `/upload`, etc.).
7. Exposes health endpoint and fallback 404 JSON handler.

---

## 2) Runtime and Request Lifecycle

### 2.1 Server bootstrap

`Backend/server.js` is the runtime entrypoint.

- Uses `dotenv` with root `.env` path.
- Uses `express.static()` over `Frontend` directory.
- Attempts to initialize MySQL and Mongo connections with graceful warnings if unavailable.
- Mounts route groups under `/api/*` and `/` (for practice-lab view + API).

### 2.2 Request flow (high-level)

1. Browser requests page or API route.
2. Static routes return HTML/CSS/JS directly from `Frontend/`.
3. API routes call backend handlers.
4. Auth-protected routes validate JWT (Authorization bearer token).
5. Handlers execute MySQL or MongoDB operations.
6. JSON response returned (or streamed media in case of videos/PDFs).

---

## 3) Frontend Page Map and Functional Behavior

The backend serves static pages from `Frontend/`.

### 3.1 Core pages

- `/` and `/home` → `Homepage.html`
- `/library` → `library.html`
- `/upload` → `upload.html`
- `/blogs` → `blogs.html`
- `/blog-editor` → `blog-editor.html`
- `/practicelab` → `practicelab.html` (via practice route file)
- Additional standalone pages include `dashboard_v2.html`, `signin.html`, `Login.html`, `timetable.html`, `acadly_learning_path.html`, `acadly_legal_hub.html`, `ai-assistant.html`.

### 3.2 Library page behavior (`Frontend/library.js`)

- Calls `GET /api/pdfs` to fetch library metadata.
- Renders PDF cards (title + iframe preview + open link).
- "Refresh" button uses `POST /api/pdfs/refresh`.
- Displays loading, empty state, and error state messages.

### 3.3 Upload page behavior (`Frontend/upload.html`)

The upload UI expects endpoints:

- `GET /api/pdfs/local-files`
- `POST /api/pdfs/upload`
- `POST /api/pdfs/import-local`

These are implemented in `Backend/routes/pdfs.js`, but this route file is **not currently mounted** in `Backend/server.js`; the mounted PDF route is `Backend/routes/pdf-library.js` (supports only `GET /api/pdfs` and `POST /api/pdfs/refresh`).

**Implication:** upload page may partially fail unless route mounting is adjusted.

### 3.4 Blogs listing behavior (`Frontend/js/blogs.js`)

- Loads `Frontend/blogs/metadata.json` via `/blogs/metadata.json`.
- Supports client-side search by title/author/excerpt/tags.
- Opens a modal and fetches raw blog content (`/blogs/<slug>.<ext>`).
- Renders Markdown using `marked`, with optional KaTeX/math rendering.

### 3.5 Blog editor behavior (`Frontend/js/blog-editor.js`)

- Supports editing modes: Markdown, rich text, LaTeX.
- Generates a metadata JSON object for insertion into blog metadata file.
- Converts rich text to markdown-compatible text for output.
- Can download generated post as `.md` file.

### 3.6 Dashboard v2 page behavior

`dashboard_v2.html` is a visual UI intended to consume `/api/dashboard/summary/:userId` and profile update endpoint for dynamic user analytics/profile data.

---

## 4) Backend API Modules

## 4.1 Authentication API (`/api/auth`)

Implemented in `Backend/routes/auth.js`.

### Endpoints

- `POST /api/auth/register`
  - Validates email/password format.
  - Checks duplicate email.
  - Hashes password.
  - Inserts user, profile, initial progress, and audit entry.

- `POST /api/auth/login`
  - Validates credentials.
  - Checks lock/inactive state.
  - Applies failed-attempt lockout policy (after 5 attempts).
  - Generates access + refresh JWT tokens.
  - Stores session and login audit.

- `POST /api/auth/refresh`
  - Validates refresh token and active session.
  - Issues new access token.

- `POST /api/auth/logout`
  - Deletes current session token row.

- `POST /api/auth/forgot-password`
  - Generates reset token and stores in password reset table.

- `POST /api/auth/reset-password`
  - Verifies reset token.
  - Hashes new password and invalidates sessions.

- `GET /api/auth/verify`
  - Verifies JWT and active session.

### Security features

- JWT access and refresh strategy.
- Account lockout window after repeated failed logins.
- Session persistence in DB (`user_sessions`).
- Login auditing (`login_audit`).

---

## 4.2 User management API (`/api/users`)

Implemented in `Backend/routes/user-management.js`.

### JWT middleware

- Reads bearer token from `Authorization` header.
- Verifies token using `JWT_SECRET`.
- Attaches `req.user_id` and `req.user_role`.

### Endpoints

- `GET /api/users/dashboard/:user_id`
  - Full user dashboard payload: profile, attendance summary, progress, recent activity, pending assignments.

- `GET /api/users/attendance/:user_id/:month/:year`
  - Detailed monthly attendance + calculated stats.

- `POST /api/users/attendance/mark`
  - Admin/teacher only.
  - Upsert one attendance record.

- `POST /api/users/attendance/bulk-mark`
  - Admin/teacher only.
  - Upserts many attendance rows.

- `GET /api/users/progress/:user_id`
  - Detailed learning progress and recent video progress.

- `GET /api/users/assignments/:user_id`
  - Assignment and submission tracking for the user.

- `POST /api/users/assignments/submit`
  - Saves/updates assignment submission.

- `GET /api/users/profile/:user_id`
  - Returns user + profile data.

- `PUT /api/users/profile/:user_id`
  - Updates user/profile fields.

---

## 4.3 Dashboard v2 API (`/api/dashboard`)

Implemented in `Backend/routes/dashboard.js`.

### Endpoints

- `GET /api/dashboard/summary/:userId`
  - Consolidates user, profile, KPI, modules, certificates, badges, gamification tags, chart datasets.

- `PUT /api/dashboard/profile/:userId`
  - Updates user identity fields + profile fields.
  - Handles duplicate email conflict (`409`).

This route powers a rich UI composition model where one API delivers the full dashboard payload.

---

## 4.4 Progress API (`/api/progress`)

Implemented in `Backend/routes/progress.js`.

### Endpoint

- `POST /api/progress/video-complete`
  - Body: `{ videoId, userId?, watchSeconds?, quizScore? }`
  - Marks video completion in `user_video_progress`.
  - Awards XP (default 25) in `user_profiles`.
  - Inserts today’s attendance (`INSERT IGNORE`).
  - If MySQL unavailable, returns fallback "demo" response.

---

## 4.5 Video API (`/api/videos`)

Implemented in `Backend/routes/videos.js`.

### Storage model

- Video binary stored in MongoDB GridFS bucket `videos`.
- Metadata stored in Mongo collection `video_metadata` via Mongoose schema.

### Endpoints

- `GET /api/videos`
  - Returns published + active videos only.
  - Maps DB docs to frontend player playlist shape.

- `POST /api/videos/upload`
  - Multipart upload field: `video`.
  - Saves local copy and uploads stream to GridFS.
  - Stores metadata (notes, quiz, subtitles, tags, XP reward, etc.).

- `GET /api/videos/:id/stream`
  - Streams video from GridFS.
  - Supports HTTP Range requests for seek/scrub support.

- `GET /api/videos/:id`
  - Returns one playlist-formatted item.

- `DELETE /api/videos/:id`
  - Deletes both metadata and GridFS binary.

---

## 4.6 PDF APIs (`/api/pdfs`)

There are two separate implementations in the repository.

### A) Mounted by server: `Backend/routes/pdf-library.js`

- `GET /api/pdfs`
- `POST /api/pdfs/refresh`

Behavior:
- Scans `Frontend/pdfs` folder.
- Syncs entries to Mongo `pdf_library` collection.
- Returns list with title/fileName/filePath.

### B) Not mounted currently: `Backend/routes/pdfs.js`

Provides full upload + GridFS PDF streaming:

- `GET /api/pdfs/local-files`
- `GET /api/pdfs`
- `POST /api/pdfs/upload`
- `POST /api/pdfs/import-local`
- `GET /api/pdfs/:id/file`

This is the route expected by `upload.html`.

---

## 4.7 Practice Lab API

Implemented in `Backend/routes/practicelab.js`.

### Endpoints

- `GET /practicelab`
  - Serves `Frontend/practicelab.html`.

- `POST /api/start-lab`
  - Reads question banks from `Questions/Subject/<Subject>/<Topic>/<difficulty>.json`.
  - Supports "All topics" aggregation.
  - Randomly samples requested question count.
  - Returns generated quiz set and metadata.

---

## 5) Data Architecture

## 5.1 MySQL responsibilities

`DataBase/schema.sql` shows MySQL handles:

- Identity and account state (`users`).
- Extended profile + gamification (`user_profiles`).
- Aggregate learning progress (`user_progress`).
- Per-video watch/completion records (`user_video_progress`, keyed by Mongo video ID string).
- Attendance tracking (`attendance`).
- Assignments/submissions (`assignments`, `assignment_submissions`).
- Dashboard v2 read models (KPI, modules, certificates, badges, charts).

## 5.2 MongoDB responsibilities

`DataBase/schema-mongo.js` defines:

- `VideoMetadata`
  - Core metadata for GridFS videos: file id, title, category/topic, duration, quiz/notes/subtitles, tags, publish state.
- `VideoFeedback`
  - Optional ratings/comments.
- `PdfDocument`
  - PDF metadata linked to GridFS file IDs.

## 5.3 Cross-database pattern

Acadly uses MySQL + Mongo together:

- MongoDB stores heavy blobs (video/pdf binaries) and document metadata.
- MySQL stores user-centric transactional data and analytics.
- Link from MySQL progress to Mongo videos uses string ObjectId (`video_id`).

---

## 6) Authentication and Authorization Model

- Access token (JWT) embeds `user_id`, `email`, and `role`.
- Refresh token (JWT) allows renewing access token.
- Active sessions tracked in database table `user_sessions`.
- Protected APIs validate bearer token and role.
- Admin/teacher role gates attendance marking routes.

---

## 7) Media and Document Flow

## 7.1 Video upload + playback flow

1. Instructor uploads via `/api/videos/upload`.
2. File first lands in local `/Videos`, then streamed into GridFS.
3. Metadata saved in `video_metadata`.
4. Player fetches `/api/videos` playlist.
5. HTML5 player streams via `/api/videos/:id/stream` using range requests.
6. Completion event can call `/api/progress/video-complete` for XP and progress.

## 7.2 PDF library flow (currently mounted path)

1. User opens `/library`.
2. Frontend calls `/api/pdfs`.
3. Route scans `Frontend/pdfs` and syncs metadata to Mongo `pdf_library`.
4. Frontend renders iframe previews of `/pdfs/<filename>` static files.

---

## 8) Practice Lab Functioning

1. User selects subject/topic/difficulty/count on practice page.
2. Frontend posts config to `/api/start-lab`.
3. Backend discovers relevant JSON banks in `Questions/Subject`.
4. Questions are merged and randomized.
5. Backend returns generated set for UI rendering/attempt.

This design enables offline-style static question bank authoring while retaining server-side randomization.

---

## 9) Operational Details

## 9.1 Startup commands

- Root has dependencies for minimal runtime.
- Backend has dedicated package with `start`/`dev` scripts.

Common local startup sequence:

1. Install root and backend deps.
2. Configure `.env` at repository root.
3. Ensure MySQL and MongoDB are reachable.
4. Run backend (`node Backend/server.js` or backend npm script).

## 9.2 Health and diagnostics

- `GET /api/health` returns server status JSON.
- On boot, console logs route mount and DB init status.
- If Mongo/MySQL unavailable, some modules degrade with warnings/fallback responses.

---

## 10) Known Implementation Notes (Important)

1. **Two PDF implementations exist** (`pdf-library.js` and `pdfs.js`).
   - Server mounts only `pdf-library.js` currently.
   - Upload page expects endpoints from `pdfs.js`.

2. **Database field naming appears mixed in auth flow.**
   - Auth route uses `password_hash` in queries/inserts.
   - Base schema snapshot includes `password` field in `users` table.
   - This mismatch should be reconciled in actual migration/schema used in deployment.

3. **Duplicate `/library` route declaration exists in server.**
   - Harmless but redundant.

4. **Fallback behavior exists in progress route** when MySQL is unavailable.
   - Useful for demos, but production should monitor and alert on fallback usage.

---

## 11) End-to-End Functional Summary

Functionally, Acadly behaves as follows:

- Serves a multi-page educational web UI from static frontend assets.
- Authenticates users via JWT and DB-backed sessions.
- Tracks attendance, assignments, and personalized learning metrics in MySQL.
- Streams educational videos from Mongo GridFS with robust range streaming.
- Maintains a PDF learning library from local folder sync (and optionally upload APIs if mounted).
- Generates practice tests from file-based question banks.
- Provides a dashboard aggregation API tailored for rich analytics UI.

In short, the platform combines **traditional academic ERP features** (attendance, assignments, profiles, dashboards) with **digital learning infrastructure** (video streaming, PDF repository, interactive practice labs).

---

## 12) Suggested Next Wiki Expansions (Optional)

To make this wiki even more exhaustive in future updates, add:

- Sequence diagrams (login, video upload, stream playback, progress writeback).
- ER diagrams for MySQL + collection diagram for Mongo.
- API request/response examples per endpoint.
- Deployment guide with Docker + environment templates.
- Observability section (logs, metrics, tracing).

