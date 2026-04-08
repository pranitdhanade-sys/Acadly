"use strict";

const express = require("express");
const path    = require("path");
const router  = express.Router();

const XP_PER_VIDEO = 25;

// Shared MySQL pool — falls back gracefully if DB is offline
let pool;
try {
  pool = require(path.join(__dirname, "../../DataBase/db_config"));
} catch {
  pool = null;
}

/**
 * POST /api/progress/video-complete
 * Body: { videoId, userId?, watchSeconds?, quizScore? }
 *
 * Records a completed video for the given user, awards XP, and
 * updates the user_profiles.xp_total aggregate.
 * If MySQL is unavailable it returns a demo response instead.
 */
router.post("/video-complete", async (req, res) => {
  const {
    videoId,
    userId      = 1,         // default to user 1 until full auth is wired in
    watchSeconds = 0,
    quizScore    = 0,
  } = req.body || {};

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required." });
  }

  const mongoVideoId = String(videoId);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO user_video_progress
           (user_id, video_id, watch_seconds, completed, xp_awarded, quiz_score)
         VALUES (?, ?, ?, 1, ?, ?)
         ON DUPLICATE KEY UPDATE
           watch_seconds = GREATEST(watch_seconds, VALUES(watch_seconds)),
           completed     = 1,
           xp_awarded    = IF(xp_awarded = 0, VALUES(xp_awarded), xp_awarded),
           quiz_score    = IF(VALUES(quiz_score) > 0, VALUES(quiz_score), quiz_score),
           last_watched  = CURRENT_TIMESTAMP`,
        [userId, mongoVideoId, watchSeconds, XP_PER_VIDEO, quizScore]
      );

      await pool.query(
        `INSERT INTO user_profiles (user_id, xp_total, last_active)
         VALUES (?, ?, CURDATE())
         ON DUPLICATE KEY UPDATE
           xp_total    = xp_total + IF(
             (SELECT xp_awarded FROM user_video_progress
              WHERE user_id = ? AND video_id = ?) = ?,
             ?, 0
           ),
           last_active = CURDATE()`,
        [userId, XP_PER_VIDEO, userId, mongoVideoId, XP_PER_VIDEO, XP_PER_VIDEO]
      );

      // Mark attendance for today
      await pool.query(
        `INSERT IGNORE INTO attendance (user_id, date) VALUES (?, CURDATE())`,
        [userId]
      ).catch(() => {}); // non-fatal

      return res.json({
        ok       : true,
        awardedXp: XP_PER_VIDEO,
        message  : "Progress saved to database.",
        source   : "database",
      });
    } catch (err) {
      console.error("progress route — DB error:", err.message);
      // Fall through to demo response
    }
  }

  // Demo / offline fallback
  console.log("Video completed (demo mode):", videoId);
  return res.json({
    ok       : true,
    awardedXp: XP_PER_VIDEO,
    message  : "Progress recorded (demo — MySQL not connected).",
    source   : "fallback",
  });
});

/**
 * POST /api/progress/save-watch-time
 * Body: { videoId, userId?, watchSeconds }
 * 
 * Saves watch progress WITHOUT marking as complete.
 * Used for continuous saving while user watches video.
 */
router.post("/save-watch-time", async (req, res) => {
  const { videoId, userId = 1, watchSeconds = 0 } = req.body || {};

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required." });
  }

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO user_video_progress (user_id, video_id, watch_seconds, completed)
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE
           watch_seconds = VALUES(watch_seconds),
           last_watched = CURRENT_TIMESTAMP`,
        [userId, String(videoId), watchSeconds]
      );

      return res.json({
        ok: true,
        message: "Watch time saved.",
        savedSeconds: watchSeconds,
      });
    } catch (err) {
      console.error("save-watch-time error:", err.message);
      return res.status(500).json({ error: "Failed to save watch time." });
    }
  }

  // Offline fallback
  return res.json({
    ok: true,
    message: "Watch time saved (offline).",
    savedSeconds: watchSeconds,
  });
});

/**
 * GET /api/progress/continue-watching?userId=1
 * 
 * Returns list of incomplete videos (continue watching section).
 * Returns videos sorted by last_watched DESC.
 */
router.get("/continue-watching", async (req, res) => {
  const userId = req.query.userId || 1;

  if (pool) {
    try {
      const rows = await pool.query(
        `SELECT 
           id, user_id, video_id, watch_seconds, completed, xp_awarded, 
           quiz_score, last_watched
         FROM user_video_progress
         WHERE user_id = ? AND completed = 0 AND watch_seconds > 0
         ORDER BY last_watched DESC
         LIMIT 20`,
        [userId]
      );

      return res.json({
        ok: true,
        data: rows || [],
        source: "database",
      });
    } catch (err) {
      console.error("continue-watching error:", err.message);
      return res.status(500).json({ error: "Failed to fetch continue watching." });
    }
  }

  // Offline fallback
  return res.json({
    ok: true,
    data: [],
    source: "offline",
  });
});

/**
 * GET /api/progress/user-stats?userId=1
 * 
 * Returns user's XP, videos watched, completion rate, etc.
 */
router.get("/user-stats", async (req, res) => {
  const userId = req.query.userId || 1;

  if (pool) {
    try {
      // Get XP and basic profile data
      const profileRows = await pool.query(
        `SELECT xp_total, level, streak_days FROM user_profiles WHERE user_id = ?`,
        [userId]
      );

      // Get video stats
      const statsRows = await pool.query(
        `SELECT 
           COUNT(*) as total_videos,
           SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_videos,
           SUM(xp_awarded) as total_xp_earned
         FROM user_video_progress
         WHERE user_id = ?`,
        [userId]
      );

      const profile = profileRows[0] || { xp_total: 0, level: 1, streak_days: 0 };
      const stats = statsRows[0] || {};

      return res.json({
        ok: true,
        profile,
        stats,
        source: "database",
      });
    } catch (err) {
      console.error("user-stats error:", err.message);
      return res.json({
        ok: true,
        profile: { xp_total: 0, level: 1, streak_days: 0 },
        stats: {},
      });
    }
  }

  // Offline fallback
  return res.json({
    ok: true,
    profile: { xp_total: 0, level: 1, streak_days: 0 },
    stats: {},
    source: "offline",
  });
});

/**
 * GET /api/progress/video-progress?videoId=xxx&userId=1
 * 
 * Returns current progress for a specific video.
 */
router.get("/video-progress", async (req, res) => {
  const { videoId, userId = 1 } = req.query;

  if (!videoId) {
    return res.status(400).json({ error: "videoId is required." });
  }

  if (pool) {
    try {
      const rows = await pool.query(
        `SELECT watch_seconds, completed, xp_awarded, quiz_score
         FROM user_video_progress
         WHERE user_id = ? AND video_id = ?`,
        [userId, String(videoId)]
      );

      const progress = rows[0] || {
        watch_seconds: 0,
        completed: 0,
        xp_awarded: 0,
        quiz_score: 0,
      };

      return res.json({
        ok: true,
        progress,
        source: "database",
      });
    } catch (err) {
      console.error("video-progress error:", err.message);
      return res.json({
        ok: true,
        progress: {
          watch_seconds: 0,
          completed: 0,
          xp_awarded: 0,
          quiz_score: 0,
        },
      });
    }
  }

  // Offline fallback
  return res.json({
    ok: true,
    progress: {
      watch_seconds: 0,
      completed: 0,
      xp_awarded: 0,
      quiz_score: 0,
    },
    source: "offline",
  });
});

module.exports = router;

