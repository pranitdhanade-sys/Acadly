-- ============================================================
--  DEPRECATED / REFERENCE ONLY — not run by Backend/setup-db.js
-- ============================================================
--
--  Use DataBase/schema.sql for MySQL (users, profiles, progress, attendance).
--  Video titles, files, quizzes, and streaming: MongoDB
--  (DataBase/schema-mongo.js, Backend/routes/videos.js, Backend/upload-videos.js).
--
--  This file previously contained a large relational “video hierarchy” model.
--  Keeping it empty avoids duplicating catalog data in two databases.
-- ============================================================

SELECT 'Use schema.sql + MongoDB for Acadly02; this script is intentionally blank.' AS note;
