-- ============================================================
--  Acadly Learning Platform — Full Database Schema
--  Run this in MySQL Workbench or via `node Backend/setup-db.js`
-- ============================================================

CREATE DATABASE IF NOT EXISTS acadly_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE acadly_db;

-- ------------------------------------------------------------
-- 1. USERS  (authentication + role)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,          -- store hashed (bcrypt) in production
  name         VARCHAR(100),
  role         ENUM('student','admin') NOT NULL DEFAULT 'student',
  avatar_url   VARCHAR(500),
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login   TIMESTAMP    NULL
);

-- ------------------------------------------------------------
-- 2. USER PROFILES  (extended info, XP, streaks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id           INT  AUTO_INCREMENT PRIMARY KEY,
  user_id      INT  NOT NULL UNIQUE,
  bio          TEXT,
  xp_total     INT  NOT NULL DEFAULT 0,
  streak_days  INT  NOT NULL DEFAULT 0,
  last_active  DATE NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 3. VIDEOS  (the AI teaching library — admin managed)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS videos (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255)  NOT NULL,
  topic         VARCHAR(255),
  description   TEXT,
  duration      VARCHAR(20),                   -- stored as "MM:SS" string for display
  src           VARCHAR(1000) NOT NULL,         -- full video URL
  thumbnail     VARCHAR(1000),
  quality       JSON,                           -- e.g. ["1080p","720p","480p"]
  playback_speeds JSON,                         -- e.g. [0.75,1,1.25,1.5,2]
  is_published  TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order    INT           NOT NULL DEFAULT 0,
  created_by    INT           NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 4. VIDEO TRACKS  (subtitles / captions per video)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS video_tracks (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  video_id    INT           NOT NULL,
  kind        VARCHAR(50)   NOT NULL DEFAULT 'subtitles',
  label       VARCHAR(100),
  srclang     VARCHAR(10),
  src         VARCHAR(1000),
  is_default  TINYINT(1)    NOT NULL DEFAULT 0,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. USER VIDEO PROGRESS  (watch time, completion, XP per user/video)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_video_progress (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  video_id      INT           NOT NULL,
  watch_seconds FLOAT         NOT NULL DEFAULT 0,
  completed     TINYINT(1)    NOT NULL DEFAULT 0,
  xp_awarded    INT           NOT NULL DEFAULT 0,
  quiz_score    INT           NOT NULL DEFAULT 0,  -- 0 = not attempted, 1 = correct
  last_watched  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_video (user_id, video_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 6. ATTENDANCE  (daily learning streaks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id       INT  AUTO_INCREMENT PRIMARY KEY,
  user_id  INT  NOT NULL,
  date     DATE NOT NULL,
  UNIQUE KEY uq_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- SEED: default admin user  (change password before production!)
-- ------------------------------------------------------------
INSERT INTO users (email, password, name, role)
VALUES ('admin@acadly.com', 'CHANGE_ME_HASHED_PASSWORD', 'Acadly Admin', 'admin')
ON DUPLICATE KEY UPDATE role = 'admin';

-- Create profile row for admin
INSERT INTO user_profiles (user_id)
SELECT id FROM users WHERE email = 'admin@acadly.com'
ON DUPLICATE KEY UPDATE user_id = user_id;
