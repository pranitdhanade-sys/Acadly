/**
 * DataBase/admin_middleware.js
 * ----------------------------
 * Guards every /api/admin route.
 * Callers must supply the secret in the  x-admin-key  request header.
 * Set ADMIN_SECRET_KEY in your .env file — never use the default in production.
 */

"use strict";

module.exports = function adminAuth(req, res, next) {
  const expectedKey = process.env.ADMIN_SECRET_KEY || "changeme-admin-secret";
  const provided    = req.headers["x-admin-key"];

  if (!provided || provided !== expectedKey) {
    return res.status(403).json({
      error  : "Forbidden",
      message: "Admin access only. Provide a valid x-admin-key header.",
    });
  }

  next();
};
