/**
 * DataBase/admin_routes.js
 * ------------------------
 * Protected by admin_middleware (header: x-admin-key).
 *
 * Video catalog is in MongoDB — manage via POST /api/videos/upload and Mongo tools.
 */

"use strict";

const express = require("express");
const router = express.Router();
const adminAuth = require("./admin_middleware");
const pool = require("./db_config");
const { connectMongoDB } = require("./db_config_mongo");
const { VideoMetadata } = require("./schema-mongo");

router.use(adminAuth);

/* ------------------------------------------------------------------ */
/*  SYSTEM STATS                                                        */
/* ------------------------------------------------------------------ */

router.get("/stats", async (req, res) => {
  try {
    const [[{ total_users }]] = await pool.query("SELECT COUNT(*) AS total_users FROM users");
    const [[{ total_completions }]] = await pool.query(
      "SELECT COUNT(*) AS total_completions FROM user_video_progress WHERE completed = 1"
    );
    const [[{ total_xp }]] = await pool.query(
      "SELECT COALESCE(SUM(xp_total),0) AS total_xp FROM user_profiles"
    );

    let total_videos = 0;
    try {
      await connectMongoDB();
      total_videos = await VideoMetadata.countDocuments({ isPublished: true, isActive: true });
    } catch (err) {
      console.warn("Admin /stats: MongoDB video count unavailable:", err.message);
    }

    return res.json({ total_users, total_videos, total_completions, total_xp });
  } catch (err) {
    console.error("Admin /stats error:", err.message);
    return res.status(500).json({ error: "Database error", details: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  USER MANAGEMENT                                                     */
/* ------------------------------------------------------------------ */

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

// Progress rows reference MongoDB video ids (no SQL videos table).
router.get("/users/:id/progress", async (req, res) => {
  const userId = Number(req.params.id);
  try {
    const [rows] = await pool.query(
      `SELECT
         vp.video_id AS mongo_video_id,
         vp.watch_seconds, vp.completed, vp.xp_awarded,
         vp.quiz_score, vp.last_watched
       FROM user_video_progress vp
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

module.exports = router;
