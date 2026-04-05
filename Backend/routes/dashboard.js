"use strict";

const express = require("express");
const path = require("path");
const router = express.Router();

let pool;
try {
  pool = require(path.join(__dirname, "../../DataBase/db_config"));
} catch {
  pool = null;
}

function userIdParam(req, res, next) {
  const id = Number(req.params.userId);
  if (!Number.isFinite(id) || id < 1) {
    return res.status(400).json({ error: "Invalid user id" });
  }
  req.dashboardUserId = id;
  next();
}

/**
 * GET /api/dashboard/summary/:userId
 * Full payload for dashboard_v2.html (read-only demo / live data).
 */
router.get("/summary/:userId", userIdParam, async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "MySQL unavailable" });
  }
  const userId = req.dashboardUserId;
  try {
    const [[user]] = await pool.query(
      `SELECT id, email, name, role, avatar_url, date_of_birth, education_level
       FROM users WHERE id = ? AND is_active = 1`,
      [userId]
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const [[profile]] = await pool.query(
      `SELECT bio, xp_total, streak_days, level, gpa, department, badges_earned
       FROM user_profiles WHERE user_id = ?`,
      [userId]
    );

    const [[kpi]] = await pool.query(
      `SELECT * FROM user_dashboard_kpi WHERE user_id = ?`,
      [userId]
    );

    const [modules] = await pool.query(
      `SELECT id, title, subtitle, progress_pct, sort_order
       FROM user_study_modules WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    const [certs] = await pool.query(
      `SELECT kind, title, subtitle_line, verifiable_id, issued_date, sort_order
       FROM user_certificate_rows WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    const [[quest]] = await pool.query(
      `SELECT title, description, progress_current, progress_total FROM user_badge_quest WHERE user_id = ?`,
      [userId]
    );

    const [badges] = await pool.query(
      `SELECT name, subtitle, status, icon_hint, sort_order
       FROM user_badge_gallery WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    const [tags] = await pool.query(
      `SELECT label, variant, sort_order FROM user_gamification_tags WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    const [hoursRows] = await pool.query(
      `SELECT weekday, hours FROM dashboard_chart_hours WHERE user_id = ?
       ORDER BY weekday ASC`,
      [userId]
    );

    const [[completion]] = await pool.query(
      `SELECT completed_pct, in_progress_pct FROM dashboard_chart_completion WHERE user_id = ?`,
      [userId]
    );

    const hoursByDay = [0, 0, 0, 0, 0, 0, 0];
    for (const row of hoursRows) {
      if (row.weekday >= 0 && row.weekday <= 6) {
        hoursByDay[row.weekday] = Number(row.hours);
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar_url: user.avatar_url,
        date_of_birth: user.date_of_birth,
        education_level: user.education_level,
      },
      profile: profile || {},
      kpi: kpi || null,
      modules,
      certificates: certs,
      badgeQuest: quest || null,
      badgeGallery: badges,
      gamificationTags: tags,
      chart: {
        hoursByDay,
        completion: completion || { completed_pct: 72, in_progress_pct: 28 },
      },
    });
  } catch (err) {
    console.error("dashboard summary:", err.message);
    res.status(500).json({ error: "Failed to load dashboard", detail: err.message });
  }
});

/**
 * PUT /api/dashboard/profile/:userId
 * Updates users + user_profiles (name, email, dob, education, department, bio).
 */
router.put("/profile/:userId", userIdParam, async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: "MySQL unavailable" });
  }
  const userId = req.dashboardUserId;
  const { name, email, date_of_birth, education_level, department, bio } = req.body || {};

  try {
    const [[existing]] = await pool.query(
      "SELECT id FROM users WHERE id = ? AND is_active = 1",
      [userId]
    );
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    if (
      name != null ||
      email != null ||
      date_of_birth !== undefined ||
      education_level !== undefined
    ) {
      const [[cur]] = await pool.query(
        "SELECT name, email, date_of_birth, education_level FROM users WHERE id = ?",
        [userId]
      );
      await pool.query(
        `UPDATE users SET name = ?, email = ?, date_of_birth = ?, education_level = ? WHERE id = ?`,
        [
          name != null ? name : cur.name,
          email != null ? email : cur.email,
          date_of_birth === "" || date_of_birth == null ? cur.date_of_birth : date_of_birth,
          education_level != null ? education_level : cur.education_level,
          userId,
        ]
      );
    }

    if (department !== undefined || bio !== undefined) {
      const [[profRow]] = await pool.query(
        "SELECT department, bio FROM user_profiles WHERE user_id = ?",
        [userId]
      );
      const dept = department !== undefined ? department : profRow?.department;
      const bioVal = bio !== undefined ? bio : profRow?.bio;
      await pool.query(
        `INSERT INTO user_profiles (user_id, department, bio, xp_total, streak_days)
         VALUES (?, ?, ?, 0, 0)
         ON DUPLICATE KEY UPDATE department = VALUES(department), bio = VALUES(bio)`,
        [userId, dept ?? null, bioVal ?? null]
      );
    }

    const [[user]] = await pool.query(
      `SELECT id, email, name, role, date_of_birth, education_level FROM users WHERE id = ?`,
      [userId]
    );
    const [[prof]] = await pool.query(
      `SELECT department, bio FROM user_profiles WHERE user_id = ?`,
      [userId]
    );

    res.json({ ok: true, user, profile: prof || {} });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error("dashboard profile update:", err.message);
    res.status(500).json({ error: "Update failed", detail: err.message });
  }
});

module.exports = router;
