/**
 * DataBase/admin_routes.js
 * ------------------------
 * ALL routes here are protected by admin_middleware.
 * Mount in server.js as:  app.use("/api/admin", require("../DataBase/admin_routes"));
 *
 * Available endpoints (all require header:  x-admin-key: <ADMIN_SECRET_KEY>):
 *
 *  GET    /api/admin/stats              — total users, videos, completions, XP
 *  GET    /api/admin/videos             — full video library with track info
 *  POST   /api/admin/videos             — add a new video
 *  PUT    /api/admin/videos/:id         — update a video
 *  DELETE /api/admin/videos/:id         — remove a video
 *  GET    /api/admin/users              — all users + profile summary
 *  GET    /api/admin/users/:id          — single user details
 *  GET    /api/admin/users/:id/progress — all video progress for a user
 */

"use strict";

const express         = require("express");
const router          = express.Router();
const adminAuth       = require("./admin_middleware");
const pool            = require("./db_config");

// Apply admin guard to every route in this file
router.use(adminAuth);

/* ------------------------------------------------------------------ */
/*  SYSTEM STATS                                                        */
/* ------------------------------------------------------------------ */

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [[{ total_users }]]      = await pool.query("SELECT COUNT(*) AS total_users FROM users");
    const [[{ total_videos }]]     = await pool.query("SELECT COUNT(*) AS total_videos FROM videos WHERE is_published = 1");
    const [[{ total_completions }]]= await pool.query("SELECT COUNT(*) AS total_completions FROM user_video_progress WHERE completed = 1");
    const [[{ total_xp }]]         = await pool.query("SELECT COALESCE(SUM(xp_total),0) AS total_xp FROM user_profiles");

    return res.json({ total_users, total_videos, total_completions, total_xp });
  } catch (err) {
    console.error("Admin /stats error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  VIDEO MANAGEMENT                                                    */
/* ------------------------------------------------------------------ */

// GET /api/admin/videos  — list all videos (published + drafts) with tracks
router.get("/videos", async (req, res) => {
  try {
    const [videos] = await pool.query(
      `SELECT v.*,
              u.name AS created_by_name
       FROM videos v
       LEFT JOIN users u ON u.id = v.created_by
       ORDER BY v.sort_order, v.id`
    );

    // Attach subtitle tracks to each video
    for (const v of videos) {
      const [tracks] = await pool.query(
        "SELECT * FROM video_tracks WHERE video_id = ?",
        [v.id]
      );
      v.tracks        = tracks.map((t) => ({
        kind    : t.kind,
        label   : t.label,
        srclang : t.srclang,
        src     : t.src,
        default : Boolean(t.is_default),
      }));
      v.quality          = safeJson(v.quality, []);
      v.playback_speeds  = safeJson(v.playback_speeds, [1]);
    }

    return res.json({ videos });
  } catch (err) {
    console.error("Admin GET /videos error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

// POST /api/admin/videos  — add a new video
router.post("/videos", async (req, res) => {
  const {
    title, topic, description, duration,
    src, thumbnail,
    quality         = ["720p"],
    playback_speeds = [1],
    is_published    = 1,
    sort_order      = 99,
    tracks          = [],
  } = req.body;

  if (!title || !src) {
    return res.status(400).json({ error: "title and src are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO videos
         (title, topic, description, duration, src, thumbnail, quality, playback_speeds, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, topic || null, description || null, duration || null,
        src, thumbnail || null,
        JSON.stringify(quality),
        JSON.stringify(playback_speeds),
        is_published ? 1 : 0,
        sort_order,
      ]
    );

    const videoId = result.insertId;

    // Insert subtitle tracks if provided
    for (const t of tracks) {
      await pool.query(
        `INSERT INTO video_tracks (video_id, kind, label, srclang, src, is_default)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [videoId, t.kind || "subtitles", t.label || null, t.srclang || null, t.src || null, t.default ? 1 : 0]
      );
    }

    return res.status(201).json({ ok: true, videoId, message: "Video added." });
  } catch (err) {
    console.error("Admin POST /videos error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

// PUT /api/admin/videos/:id  — update a video
router.put("/videos/:id", async (req, res) => {
  const videoId = Number(req.params.id);
  const fields  = req.body;

  const allowed = ["title","topic","description","duration","src","thumbnail",
                   "quality","playback_speeds","is_published","sort_order"];
  const updates = [];
  const values  = [];

  for (const key of allowed) {
    if (key in fields) {
      updates.push(`${key} = ?`);
      const val = (key === "quality" || key === "playback_speeds")
        ? JSON.stringify(fields[key])
        : fields[key];
      values.push(val);
    }
  }

  if (!updates.length) {
    return res.status(400).json({ error: "No valid fields provided to update." });
  }

  values.push(videoId);

  try {
    const [result] = await pool.query(
      `UPDATE videos SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video not found." });
    }
    return res.json({ ok: true, message: "Video updated." });
  } catch (err) {
    console.error("Admin PUT /videos/:id error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

// DELETE /api/admin/videos/:id  — remove a video (cascades to tracks & progress)
router.delete("/videos/:id", async (req, res) => {
  const videoId = Number(req.params.id);
  try {
    const [result] = await pool.query("DELETE FROM videos WHERE id = ?", [videoId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Video not found." });
    }
    return res.json({ ok: true, message: "Video deleted." });
  } catch (err) {
    console.error("Admin DELETE /videos/:id error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  USER MANAGEMENT                                                     */
/* ------------------------------------------------------------------ */

// GET /api/admin/users  — all users with profile summary
router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      `SELECT
         u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.last_login,
         COALESCE(p.xp_total, 0)     AS xp_total,
         COALESCE(p.streak_days, 0)  AS streak_days,
         p.last_active
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users });
  } catch (err) {
    console.error("Admin GET /users error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

// GET /api/admin/users/:id  — single user details
router.get("/users/:id", async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const [[user]] = await pool.query(
      `SELECT
         u.id, u.email, u.name, u.role, u.avatar_url, u.created_at, u.last_login,
         p.bio, COALESCE(p.xp_total,0) AS xp_total,
         COALESCE(p.streak_days,0) AS streak_days, p.last_active
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );
    if (!user) return res.status(404).json({ error: "User not found." });

    return res.json({ user });
  } catch (err) {
    console.error("Admin GET /users/:id error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

// GET /api/admin/users/:id/progress  — all video progress for a user
router.get("/users/:id/progress", async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      `SELECT
         vp.video_id, v.title, v.topic, v.duration,
         vp.watch_seconds, vp.completed, vp.xp_awarded,
         vp.quiz_score, vp.last_watched
       FROM user_video_progress vp
       JOIN videos v ON v.id = vp.video_id
       WHERE vp.user_id = ?
       ORDER BY vp.last_watched DESC`,
      [userId]
    );
    return res.json({ userId, progress: rows });
  } catch (err) {
    console.error("Admin GET /users/:id/progress error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  HELPERS                                                             */
/* ------------------------------------------------------------------ */
function safeJson(value, fallback) {
  if (Array.isArray(value)) return value;
  try   { return JSON.parse(value); }
  catch { return fallback; }
}

module.exports = router;
