"use strict";

const express = require("express");
const db = require("../db_config");
const { verifyJwtSession, logUserActivity } = require("../middleware_auth");

const router = express.Router();

router.get("/:moduleId", verifyJwtSession, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const [rows] = await db.query(
      `SELECT lesson_id, status, xp_awarded, completed_at
       FROM roadmap_progress
       WHERE user_id = ? AND module_id = ?
       ORDER BY lesson_id ASC`,
      [req.auth.user_id, moduleId]
    );

    const progress = {};
    let xpTotal = 0;
    for (const row of rows) {
      progress[row.lesson_id] = row.status;
      xpTotal += Number(row.xp_awarded || 0);
    }

    res.json({ module_id: moduleId, progress, xp_total: xpTotal, count: rows.length });
  } catch (err) {
    console.error("roadmap get error:", err.message);
    res.status(500).json({ error: "Failed to load roadmap progress" });
  }
});

router.post("/:moduleId/lesson/:lessonId/complete", verifyJwtSession, async (req, res) => {
  try {
    const { moduleId, lessonId } = req.params;
    const numericLesson = Number(lessonId);
    if (!Number.isInteger(numericLesson) || numericLesson < 1) {
      return res.status(400).json({ error: "Invalid lesson id" });
    }

    const xpAward = numericLesson === 10 ? 120 : numericLesson === 5 ? 80 : 40;
    await db.query(
      `INSERT INTO roadmap_progress (user_id, module_id, lesson_id, status, xp_awarded, completed_at, updated_at)
       VALUES (?, ?, ?, 'done', ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
         status = VALUES(status),
         xp_awarded = GREATEST(xp_awarded, VALUES(xp_awarded)),
         completed_at = COALESCE(completed_at, VALUES(completed_at)),
         updated_at = NOW()`,
      [req.auth.user_id, moduleId, numericLesson, xpAward]
    );

    await db.query(
      `INSERT INTO user_profiles (user_id, xp_total, streak_days)
       VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE xp_total = xp_total + VALUES(xp_total)`,
      [req.auth.user_id, xpAward]
    );

    await logUserActivity(req.auth.user_id, "roadmap.lesson.completed", {
      module_id: moduleId,
      lesson_id: numericLesson,
      xp_awarded: xpAward,
    });

    res.json({ ok: true, module_id: moduleId, lesson_id: numericLesson, xp_awarded: xpAward });
  } catch (err) {
    console.error("roadmap complete error:", err.message);
    res.status(500).json({ error: "Failed to update roadmap" });
  }
});

router.post("/activity", verifyJwtSession, async (req, res) => {
  const { event_type, payload } = req.body || {};
  if (!event_type) return res.status(400).json({ error: "event_type required" });
  await logUserActivity(req.auth.user_id, event_type, payload || {});
  res.status(201).json({ ok: true });
});

module.exports = router;
