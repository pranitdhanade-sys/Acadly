"use strict";

const jwt = require("jsonwebtoken");
const db = require("../DataBase/db_config");

function extractBearer(req) {
  const value = req.headers.authorization || "";
  if (!value.toLowerCase().startsWith("bearer ")) return null;
  return value.slice(7).trim();
}

async function verifyJwtSession(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) return res.status(401).json({ error: "Authorization token required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    const [sessions] = await db.query(
      `SELECT id FROM user_sessions WHERE user_id = ? AND session_token = ? AND expires_at > NOW() LIMIT 1`,
      [decoded.user_id, token]
    );

    if (!sessions.length) {
      return res.status(403).json({ error: "Session expired or invalid" });
    }

    req.auth = {
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      token,
    };

    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid token" });
  }
}

async function logUserActivity(userId, eventType, metadata = {}) {
  try {
    await db.query(
      `INSERT INTO user_activity_log (user_id, event_type, metadata_json, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, eventType, JSON.stringify(metadata)]
    );
  } catch (err) {
    console.warn("activity log write failed:", err.message);
  }
}

module.exports = {
  verifyJwtSession,
  logUserActivity,
};
