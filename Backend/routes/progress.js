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

  if (pool) {
    try {
      // Upsert progress row
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
        [userId, videoId, watchSeconds, XP_PER_VIDEO, quizScore]
      );

      // Update aggregate XP in user_profiles (creates row if missing)
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
        [userId, XP_PER_VIDEO, userId, videoId, XP_PER_VIDEO, XP_PER_VIDEO]
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

module.exports = router;

