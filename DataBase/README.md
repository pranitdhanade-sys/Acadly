# Acadly — DataBase Setup Guide

> **Owner / Admin Only** — this folder contains server-side database files.  
> Never expose these files to the public or commit real credentials.

---

## What's in this folder

| File | Purpose |
|---|---|
| `schema.sql` | Creates all tables in `acadly_db` |
| `seed_videos.sql` | Inserts 8 AI teaching videos |
| `db_config.js` | Shared MySQL pool (used by all backend routes) |
| `admin_middleware.js` | API-key guard that blocks public users |
| `admin_routes.js` | Admin-only REST endpoints (video CRUD, user info, stats) |

---

## Step 1 — Install MySQL & MySQL Workbench

Download **MySQL Community Server** and **MySQL Workbench** from  
https://dev.mysql.com/downloads/  
During installation choose the default port **3306** and note your root password.

---

## Step 2 — Create the database (MySQL Workbench)

1. Open **MySQL Workbench** and connect to `localhost:3306` as `root`.
2. Click **File → Open SQL Script** and open `DataBase/schema.sql`.
3. Click the ⚡ **Execute All** button (or press `Ctrl+Shift+Enter`).
4. Repeat with `DataBase/seed_videos.sql` to load all 8 videos.

You should now see the `acadly_db` database in the **Schemas** panel on the left.

---

## Step 3 — Configure environment variables

Copy `.env.example` to `.env` in the project root and fill in your values:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=acadly_db

ADMIN_SECRET_KEY=pick-a-long-random-string-here
PORT=3000
```

> **Never commit `.env` to git** — it is already in `.gitignore`.

---

## Step 4 — Alternatively, run setup via Node

```bash
cd Backend
node setup-db.js
```

This runs `schema.sql` + `seed_videos.sql` automatically and prints each step.

---

## Step 5 — Start the server

```bash
cd Backend
npm install
npm start
```

The server will print `✅ MySQL connected → database: acadly_db` if everything is working.

---

## Admin API Reference

All admin routes live at `/api/admin/...` and require the HTTP header:

```
x-admin-key: <ADMIN_SECRET_KEY from .env>
```

Without the header every request returns **403 Forbidden**.

### Stats
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/stats` | Total users, videos, completions, XP |

### Video Management
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/videos` | List all videos (including unpublished) |
| POST | `/api/admin/videos` | Add a new video |
| PUT | `/api/admin/videos/:id` | Update a video |
| DELETE | `/api/admin/videos/:id` | Delete a video |

**POST / PUT body fields:**
- `title` (string, required for POST)
- `src` (URL, required for POST)
- `topic`, `description`, `duration`, `thumbnail`
- `quality` (array e.g. `["1080p","720p"]`)
- `playback_speeds` (array e.g. `[0.75,1,1.25,1.5,2]`)
- `is_published` (0 or 1)
- `sort_order` (integer)
- `tracks` (array of subtitle objects)

### User Management
| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users with XP & streak |
| GET | `/api/admin/users/:id` | Single user details |
| GET | `/api/admin/users/:id/progress` | All video progress for a user |

---

## Database Tables

```
acadly_db
├── users                — login credentials, role (student / admin)
├── user_profiles        — bio, XP total, streak, last active date
├── videos               — AI teaching video library (admin managed)
├── video_tracks         — subtitles / captions per video
├── user_video_progress  — per-user watch time, completion, quiz scores
└── attendance           — daily check-in records for streak tracking
```

All tables viewable in **MySQL Workbench** under `acadly_db` → **Tables**.
