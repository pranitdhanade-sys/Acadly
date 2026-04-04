-- ============================================================
--  Acadly Learning Platform — Complete Enhanced Schema
--  Run this in MySQL Workbench or via `node Backend/setup-db.js`
--  Last Updated: April 2026
-- ============================================================

CREATE DATABASE IF NOT EXISTS acadly_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE acadly_db;

-- ============================================================
-- AUTHENTICATION & USERS
-- ============================================================

-- 1. USERS TABLE (Core authentication)
CREATE TABLE IF NOT EXISTS users (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  name              VARCHAR(100) NOT NULL,
  role              ENUM('student','teacher','admin') NOT NULL DEFAULT 'student',
  avatar_url        VARCHAR(500),
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  email_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  phone             VARCHAR(20),
  date_of_birth     DATE,
  gender            ENUM('M','F','Other'),
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login        TIMESTAMP    NULL,
  last_ip_address   VARCHAR(45),
  login_attempts    INT          NOT NULL DEFAULT 0,
  locked_until      TIMESTAMP    NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
);

-- 2. USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  session_token     VARCHAR(255) UNIQUE NOT NULL,
  refresh_token     VARCHAR(255) UNIQUE,
  expires_at        TIMESTAMP    NOT NULL,
  ip_address        VARCHAR(45),
  user_agent        VARCHAR(500),
  device_type       VARCHAR(50),
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- 3. PASSWORD RESET TOKENS
CREATE TABLE IF NOT EXISTS password_resets (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL UNIQUE,
  reset_token       VARCHAR(255) UNIQUE NOT NULL,
  expires_at        TIMESTAMP    NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. LOGIN AUDIT TRAIL
CREATE TABLE IF NOT EXISTS login_audit (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT,
  email             VARCHAR(255),
  status            ENUM('success','failed','locked') NOT NULL,
  ip_address        VARCHAR(45),
  user_agent        VARCHAR(500),
  reason            VARCHAR(255),
  attempted_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_attempted_at (attempted_at)
);

-- ============================================================
-- USER PROFILES & MANAGEMENT
-- ============================================================

-- 5. USER PROFILES (Extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL UNIQUE,
  bio               TEXT,
  department        VARCHAR(100),
  semester          INT,
  gpa               DECIMAL(3,2) DEFAULT 0.00,
  xp_total          INT          NOT NULL DEFAULT 0,
  streak_days       INT          NOT NULL DEFAULT 0,
  level             INT          NOT NULL DEFAULT 1,
  badges_earned     JSON,
  last_active       TIMESTAMP    NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_department (department),
  INDEX idx_xp_total (xp_total)
);

-- ============================================================
-- ATTENDANCE TRACKING
-- ============================================================

-- 6. ATTENDANCE (Daily check-in)
CREATE TABLE IF NOT EXISTS attendance (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  date              DATE         NOT NULL,
  check_in_time     TIME,
  check_out_time    TIME,
  duration_minutes  INT,
  device_type       VARCHAR(50),
  ip_address        VARCHAR(45),
  status            ENUM('present','absent','late','excused') NOT NULL,
  notes             TEXT,
  UNIQUE KEY uq_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
);

-- 7. ATTENDANCE REPORTS (Monthly summaries)
CREATE TABLE IF NOT EXISTS attendance_reports (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  month             INT          NOT NULL,
  year              INT          NOT NULL,
  total_days        INT,
  present_days      INT,
  absent_days       INT,
  late_days         INT,
  excused_days      INT,
  attendance_percentage DECIMAL(5,2),
  generated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_month_year (user_id, month, year),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- USER PROGRESS & PERFORMANCE
-- ============================================================

-- 8. USER PROGRESS (Overall progress metrics)
CREATE TABLE IF NOT EXISTS user_progress (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL UNIQUE,
  total_videos_watched INT       NOT NULL DEFAULT 0,
  total_watch_time_minutes INT   NOT NULL DEFAULT 0,
  average_video_completion_percentage DECIMAL(5,2),
  certificates_earned INT         NOT NULL DEFAULT 0,
  quiz_attempts     INT          NOT NULL DEFAULT 0,
  quiz_pass_rate    DECIMAL(5,2),
  average_quiz_score DECIMAL(5,2),
  streak_current    INT          NOT NULL DEFAULT 0,
  streak_longest    INT          NOT NULL DEFAULT 0,
  last_updated      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- ============================================================
-- VIDEO CONTENT HIERARCHY
-- ============================================================

-- 9. VIDEO CATEGORIES (Level 1: Engineering, Arts, Business, etc.)
CREATE TABLE IF NOT EXISTS video_categories (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL UNIQUE,
  slug              VARCHAR(255) UNIQUE NOT NULL,
  description       TEXT,
  icon_url          VARCHAR(500),
  color_code        VARCHAR(7),
  sort_order        INT          DEFAULT 0,
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_sort_order (sort_order)
);

-- 10. VIDEO SUBCATEGORIES (Level 2: CSE, Mechanical, Civil, etc.)
CREATE TABLE IF NOT EXISTS video_subcategories (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  category_id       INT          NOT NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  icon_url          VARCHAR(500),
  sort_order        INT          DEFAULT 0,
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES video_categories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_category_name (category_id, name),
  INDEX idx_category_id (category_id),
  INDEX idx_sort_order (sort_order)
);

-- 11. VIDEO TOPICS (Level 3: OOP, Algorithms, Data Structures, etc.)
CREATE TABLE IF NOT EXISTS video_topics (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  subcategory_id    INT          NOT NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  prerequisites     JSON,
  difficulty_level  ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  estimated_hours   DECIMAL(5,2),
  sort_order        INT          DEFAULT 0,
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES video_subcategories(id) ON DELETE CASCADE,
  UNIQUE KEY uq_subcategory_name (subcategory_id, name),
  INDEX idx_subcategory_id (subcategory_id),
  INDEX idx_sort_order (sort_order)
);

-- 12. VIDEOS (The actual video content)
CREATE TABLE IF NOT EXISTS videos (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  topic_id          INT           NOT NULL,
  title             VARCHAR(255)  NOT NULL,
  description       TEXT,
  duration_seconds  INT,
  video_url         VARCHAR(1000) NOT NULL,
  thumbnail_url     VARCHAR(1000),
  transcript_url    VARCHAR(1000),
  quality_options   JSON,
  playback_speeds   JSON,
  instructor_id     INT,
  instructor_name   VARCHAR(100),
  view_count        INT           DEFAULT 0,
  is_published      TINYINT(1)    DEFAULT 1,
  sequence_order    INT           DEFAULT 0,
  created_by        INT,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES video_topics(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_title_topic (title, topic_id),
  INDEX idx_topic_id (topic_id),
  INDEX idx_is_published (is_published),
  INDEX idx_sequence_order (sequence_order)
);

-- 13. VIDEO TRACKS (Subtitles/Captions)
CREATE TABLE IF NOT EXISTS video_tracks (
  id          INT           AUTO_INCREMENT PRIMARY KEY,
  video_id    INT           NOT NULL,
  kind        VARCHAR(50)   NOT NULL DEFAULT 'subtitles',
  label       VARCHAR(100),
  srclang     VARCHAR(10),
  src         VARCHAR(1000),
  is_default  TINYINT(1)    NOT NULL DEFAULT 0,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_video_id (video_id)
);

-- 14. USER VIDEO PROGRESS (Track viewing for each user)
CREATE TABLE IF NOT EXISTS user_video_progress (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       INT           NOT NULL,
  video_id      INT           NOT NULL,
  watch_seconds FLOAT         NOT NULL DEFAULT 0,
  completed     TINYINT(1)    NOT NULL DEFAULT 0,
  xp_awarded    INT           NOT NULL DEFAULT 0,
  quiz_score    INT           NOT NULL DEFAULT 0,
  last_watched  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_video (user_id, video_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_completed (completed)
);

-- 15. VIDEO QUIZZES (Questions for each video)
CREATE TABLE IF NOT EXISTS video_quizzes (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  video_id          INT           NOT NULL,
  title             VARCHAR(255),
  order_number      INT,
  question_type     ENUM('mcq','true_false','short_answer','essay'),
  question_text     TEXT          NOT NULL,
  options           JSON,
  correct_answer    VARCHAR(500),
  xp_reward         INT           DEFAULT 10,
  difficulty        ENUM('easy','medium','hard') DEFAULT 'easy',
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_video_id (video_id),
  INDEX idx_order_number (order_number)
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================

-- 16. ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  topic_id          INT,
  due_date          DATETIME     NOT NULL,
  max_score         DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_by        INT          NOT NULL,
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_topic_id (topic_id),
  INDEX idx_due_date (due_date)
);

-- 17. ASSIGNMENT SUBMISSIONS
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  assignment_id     INT          NOT NULL,
  user_id           INT          NOT NULL,
  submission_url    VARCHAR(1000),
  submission_text   TEXT,
  submitted_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score             DECIMAL(5,2),
  feedback          TEXT,
  graded_by         INT,
  graded_at         TIMESTAMP    NULL,
  status            ENUM('submitted','graded','pending') NOT NULL DEFAULT 'pending',
  UNIQUE KEY uq_assignment_user (assignment_id, user_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- ============================================================
-- PLAYLISTS & COLLECTIONS
-- ============================================================

-- 18. PLAYLISTS
CREATE TABLE IF NOT EXISTS playlists (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255)  NOT NULL,
  description       TEXT,
  category_id       INT,
  subcategory_id    INT,
  topic_id          INT,
  instructor_id     INT,
  thumbnail_url     VARCHAR(1000),
  is_public         TINYINT(1)    DEFAULT 1,
  view_count        INT           DEFAULT 0,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES video_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES video_subcategories(id) ON DELETE SET NULL,
  FOREIGN KEY (topic_id) REFERENCES video_topics(id) ON DELETE SET NULL,
  FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category_id (category_id)
);

-- 19. PLAYLIST VIDEOS (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS playlist_videos (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  playlist_id       INT           NOT NULL,
  video_id          INT           NOT NULL,
  sequence_order    INT,
  UNIQUE KEY uq_playlist_video (playlist_id, video_id),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_playlist_id (playlist_id),
  INDEX idx_sequence_order (sequence_order)
);

-- ============================================================
-- CERTIFICATES
-- ============================================================

-- 20. CERTIFICATES (Course completion certificates)
CREATE TABLE IF NOT EXISTS certificates (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  course_id         INT,
  certificate_type  VARCHAR(100),
  issued_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  certificate_url   VARCHAR(1000),
  is_verified       TINYINT(1)   NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_issued_at (issued_at)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed: Default admin user
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES ('admin@acadly.com', '$2a$10$6t3xGJJb3XEZmEh1TFCfj.4pFWqkHG2U5Z5OZ3Tz4pX5MK5Qyy4Ku', 'Acadly Admin', 'admin', 1)
ON DUPLICATE KEY UPDATE role = 'admin';

-- Create profile for admin
INSERT INTO user_profiles (user_id, xp_total, streak_days)
SELECT id, 0, 0 FROM users WHERE email = 'admin@acadly.com'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- Seed: Video Categories
INSERT INTO video_categories (name, slug, description, color_code, sort_order, is_active) VALUES
('Engineering', 'engineering', 'Core engineering disciplines and technical skills', '#FF6B6B', 1, 1),
('Arts & Humanities', 'arts-humanities', 'Liberal arts, languages, and humanities courses', '#4ECDC4', 2, 1),
('Business & Management', 'business', 'Business, marketing, and management studies', '#FFE66D', 3, 1),
('Science', 'science', 'Physics, chemistry, biology, and natural sciences', '#95E1D3', 4, 1)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- Seed: Subcategories for Engineering
INSERT INTO video_subcategories (category_id, name, slug, description, sort_order, is_active) VALUES
(1, 'Computer Science & Engineering', 'cse', 'Programming, algorithms, and software development', 1, 1),
(1, 'Civil Engineering', 'civil', 'Structural design and civil infrastructure', 2, 1),
(1, 'Mechanical Engineering', 'mechanical', 'Mechanics, thermodynamics, and machine design', 3, 1)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- Seed: Topics for CSE
INSERT INTO video_topics (subcategory_id, name, slug, description, difficulty_level, estimated_hours, sort_order, is_active) VALUES
(1, 'Object-Oriented Programming', 'oop', 'Learn OOP principles: classes, inheritance, polymorphism, encapsulation', 'beginner', 12, 1, 1),
(1, 'Data Structures', 'data-structures', 'Arrays, linked lists, trees, graphs, and search algorithms', 'intermediate', 15, 2, 1),
(1, 'Algorithms & Complexity', 'algorithms', 'Sorting, searching, dynamic programming, and Big O analysis', 'advanced', 18, 3, 1)
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order);

-- Seed: Sample Videos for OOP Topic
INSERT INTO videos (topic_id, title, description, duration_seconds, video_url, thumbnail_url, instructor_name, sequence_order, is_published) VALUES
(1, 'Classes and Objects Explained', 'Introduction to OOP fundamentals - creating and using classes', 1200, '/videos/oop/classes-objects.mp4', '/thumbnails/oop-classes.jpg', 'Dr. John Smith', 1, 1),
(1, 'Inheritance and Polymorphism', 'Understanding inheritance hierarchies and method overriding', 1500, '/videos/oop/inheritance-polymorphism.mp4', '/thumbnails/oop-inheritance.jpg', 'Dr. John Smith', 2, 1),
(1, 'Encapsulation and Access Modifiers', 'Private, public, and protected access levels', 900, '/videos/oop/encapsulation.mp4', '/thumbnails/oop-encapsulation.jpg', 'Dr. Jane Doe', 3, 1)
ON DUPLICATE KEY UPDATE sequence_order = VALUES(sequence_order);

-- Create progress entry for admin
INSERT INTO user_progress (user_id, total_videos_watched, total_watch_time_minutes)
SELECT id, 0, 0 FROM users WHERE email = 'admin@acadly.com'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Additional performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_videos_topic_published ON videos(topic_id, is_published);
CREATE INDEX idx_attendance_user_month ON attendance(user_id, MONTH(date), YEAR(date));
CREATE INDEX idx_user_video_progress_user ON user_video_progress(user_id, completed);
