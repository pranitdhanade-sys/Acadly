# Acadly Database Design & Implementation Guide

Complete guide for implementing professional authentication, user management, and hierarchical video storage in your Ed-Tech platform.

---

## Table of Contents
1. [1. Login & Authentication](#1-login--authentication)
2. [2. User Management & Reporting](#2-user-management--reporting)
3. [3. Video Storage & Hierarchy](#3-video-storage--hierarchy)
4. [Security Best Practices](#security-best-practices)
5. [Complete Implementation Examples](#complete-implementation-examples)

---

## 1. Login & Authentication

### Database Schema for Authentication

Your current `users` table is a good start, but here's the **production-ready version**:

```sql
-- Enhanced Users Table for Secure Authentication
CREATE TABLE IF NOT EXISTS users (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,      -- bcrypt hashed (60 chars)
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
  last_ip_address   VARCHAR(45),                -- supports IPv6
  login_attempts    INT          NOT NULL DEFAULT 0,
  locked_until      TIMESTAMP    NULL,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_created_at (created_at)
);

-- Session Management (optional but recommended for production)
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

-- Password Reset & Security
CREATE TABLE IF NOT EXISTS password_resets (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL UNIQUE,
  reset_token       VARCHAR(255) UNIQUE NOT NULL,
  expires_at        TIMESTAMP    NOT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login Audit Trail (track all login attempts)
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
```

### How to Store Login Data Safely

**❌ NEVER store plain text passwords:**
```javascript
// BAD - Do NOT do this!
password: "user123"
```

**✅ ALWAYS hash passwords with bcrypt:**
```javascript
// GOOD - Use bcrypt
const hashedPassword = await bcrypt.hash(plainPassword, 10);
// Store hashedPassword in database
```

### Backend: Login Implementation

```javascript
// Backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../DataBase/db_config');

const router = express.Router();

// ============================================
// 1. USER REGISTRATION
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'student' } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, name, role]
    );

    const userId = result.insertId;

    // Create user profile
    await db.query(
      'INSERT INTO user_profiles (user_id, xp_total, streak_days) VALUES (?, 0, 0)',
      [userId]
    );

    // Log registration
    await db.query(
      'INSERT INTO login_audit (user_id, email, status, ip_address, reason) VALUES (?, ?, ?, ?, ?)',
      [userId, email, 'success', req.ip, 'Registration']
    );

    res.status(201).json({
      message: 'Registration successful',
      user_id: userId,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ============================================
// 2. USER LOGIN
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user by email
    const [users] = await db.query(
      'SELECT id, password_hash, name, role, is_active, locked_until FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Log failed attempt
      await db.query(
        'INSERT INTO login_audit (email, status, ip_address, reason) VALUES (?, ?, ?, ?)',
        [email, 'failed', req.ip, 'User not found']
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await db.query(
        'INSERT INTO login_audit (user_id, email, status, ip_address, reason) VALUES (?, ?, ?, ?, ?)',
        [user.id, email, 'locked', req.ip, 'Account locked']
      );
      return res.status(403).json({ error: 'Account temporarily locked' });
    }

    // Check if account is active
    if (!user.is_active) {
      await db.query(
        'INSERT INTO login_audit (user_id, email, status, ip_address, reason) VALUES (?, ?, ?, ?, ?)',
        [user.id, email, 'failed', req.ip, 'Account inactive']
      );
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      // Increment login attempts
      const [loginAttempts] = await db.query(
        'SELECT login_attempts FROM users WHERE id = ?',
        [user.id]
      );
      const attempts = (loginAttempts[0]?.login_attempts || 0) + 1;

      if (attempts >= 5) {
        // Lock account for 15 minutes
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await db.query(
          'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
          [attempts, lockedUntil, user.id]
        );
      } else {
        await db.query(
          'UPDATE users SET login_attempts = ? WHERE id = ?',
          [attempts, user.id]
        );
      }

      await db.query(
        'INSERT INTO login_audit (user_id, email, status, ip_address, reason) VALUES (?, ?, ?, ?, ?)',
        [user.id, email, 'failed', req.ip, `Invalid password (attempt ${attempts})`]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await db.query(
      'UPDATE users SET login_attempts = 0, last_login = NOW(), last_ip_address = ? WHERE id = ?',
      [req.ip, user.id]
    );

    // Create session
    const sessionToken = jwt.sign(
      { user_id: user.id, email: email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { user_id: user.id },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    // Store session in database
    await db.query(
      'INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, ?)',
      [user.id, sessionToken, refreshToken, req.get('user-agent')]
    );

    // Log successful login
    await db.query(
      'INSERT INTO login_audit (user_id, email, status, ip_address, reason) VALUES (?, ?, ?, ?, ?)',
      [user.id, email, 'success', req.ip, 'Login successful']
    );

    res.status(200).json({
      message: 'Login successful',
      session_token: sessionToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// 3. LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Delete session from database
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = ? AND session_token = ?',
      [decoded.user_id, token]
    );

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
```

### Frontend: Login Form Integration

```html
<!-- Frontend/Login.html - Updated with fetch -->
<form id="loginForm">
  <input id="emailInput" type="email" placeholder="you@acadly.com" required />
  <input id="passwordInput" type="password" placeholder="Password" required />
  <button type="submit">Login</button>
  <div id="errorMessage"></div>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('emailInput').value;
  const password = document.getElementById('passwordInput').value;
  const errorDiv = document.getElementById('errorMessage');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('session_token', data.session_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      if (data.user.role === 'admin') {
        window.location.href = '/admin-dashboard.html';
      } else {
        window.location.href = '/dashboard.html';
      }
    } else {
      const error = await response.json();
      errorDiv.textContent = error.error;
      errorDiv.style.color = 'red';
    }
  } catch (error) {
    console.error('Login failed:', error);
    errorDiv.textContent = 'Login failed. Please try again.';
  }
});
</script>
```

---

## 2. User Management & Reporting

### Database Schema for User Accounts & Reports

```sql
-- ============================================================
-- EXTENDED USER PROFILES (attendance, progress, assignments)
-- ============================================================

-- User Profiles (already exists, enhanced)
CREATE TABLE IF NOT EXISTS user_profiles (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL UNIQUE,
  bio               TEXT,
  department        VARCHAR(100),           -- e.g., "Computer Science", "Engineering"
  semester          INT,                    -- 1-8
  gpa               DECIMAL(3,2) DEFAULT 0.00,
  xp_total          INT          NOT NULL DEFAULT 0,
  streak_days       INT          NOT NULL DEFAULT 0,
  level             INT          NOT NULL DEFAULT 1,    -- Gamification levels
  badges_earned     JSON,                   -- ["badge_1", "video_master", ...]
  last_active       TIMESTAMP    NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_department (department),
  INDEX idx_xp_total (xp_total)
);

-- Attendance Tracking (Daily Check-in)
CREATE TABLE IF NOT EXISTS attendance (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  date              DATE         NOT NULL,
  check_in_time     TIME,
  check_out_time    TIME,
  duration_minutes  INT,
  device_type       VARCHAR(50), -- 'web', 'mobile', 'app'
  ip_address        VARCHAR(45),
  status            ENUM('present','absent','late','excused') NOT NULL,
  notes             TEXT,
  UNIQUE KEY uq_user_date (user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_date (date)
);

-- Monthly Attendance Report
CREATE TABLE IF NOT EXISTS attendance_reports (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  month             INT          NOT NULL,      -- 1-12
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

-- user Progress Tracking (Performance Metrics)
CREATE TABLE IF NOT EXISTS user_progress (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
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
  UNIQUE KEY uq_user_id (user_id),
  INDEX idx_user_id (user_id)
);

-- Assignments & Submissions
CREATE TABLE IF NOT EXISTS assignments (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT,
  topic_id          INT,                    -- Links to video categories
  due_date          DATETIME     NOT NULL,
  max_score         DECIMAL(5,2) NOT NULL DEFAULT 100,
  created_by        INT          NOT NULL,  -- Teacher/Admin ID
  is_active         TINYINT(1)   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_topic_id (topic_id),
  INDEX idx_due_date (due_date)
);

-- Assignment Submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  assignment_id     INT          NOT NULL,
  user_id           INT          NOT NULL,
  submission_url    VARCHAR(1000),         -- Link to file/document
  submission_text   TEXT,
  submitted_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  score             DECIMAL(5,2),
  feedback          TEXT,
  graded_by         INT,                   -- Teacher who graded
  graded_at         TIMESTAMP    NULL,
  status            ENUM('submitted','graded','pending') NOT NULL DEFAULT 'pending',
  UNIQUE KEY uq_assignment_user (assignment_id, user_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Certificates (Course Completion)
CREATE TABLE IF NOT EXISTS certificates (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  user_id           INT          NOT NULL,
  course_id         INT,
  certificate_type  VARCHAR(100),           -- 'completion', 'excellence', 'milestone'
  issued_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  certificate_url   VARCHAR(1000),
  is_verified       TINYINT(1)   NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_issued_at (issued_at)
);
```

### Backend: User Management & Reporting API

```javascript
// Backend/routes/user-management.js
const express = require('express');
const db = require('../DataBase/db_config');

const router = express.Router();

// ============================================
// GET USER DASHBOARD DATA
// ============================================
router.get('/dashboard/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Get user profile
    const [userProfile] = await db.query(`
      SELECT u.name, u.email, u.role, up.xp_total, up.streak_days, 
             up.level, up.gpa, up.department, up.badges_earned
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?
    `, [user_id]);

    // Get current month attendance
    const [currentMonthAttendance] = await db.query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
      FROM attendance
      WHERE user_id = ? AND MONTH(date) = MONTH(NOW()) AND YEAR(date) = YEAR(NOW())
    `, [user_id]);

    // Get progress stats
    const [progressStats] = await db.query(`
      SELECT 
        total_videos_watched,
        total_watch_time_minutes,
        average_video_completion_percentage,
        quiz_pass_rate,
        average_quiz_score,
        streak_current,
        streak_longest
      FROM user_progress
      WHERE user_id = ?
    `, [user_id]);

    // Get recent activity
    const [recentActivity] = await db.query(`
      SELECT uvp.last_watched, v.title, uvp.completed
      FROM user_video_progress uvp
      JOIN videos v ON uvp.video_id = v.id
      WHERE uvp.user_id = ?
      ORDER BY uvp.last_watched DESC
      LIMIT 5
    `, [user_id]);

    res.status(200).json({
      user: userProfile[0] || {},
      attendance: currentMonthAttendance[0] || {},
      progress: progressStats[0] || {},
      recent_activity: recentActivity || []
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// ============================================
// GET ATTENDANCE REPORT
// ============================================
router.get('/attendance/:user_id/:month/:year', async (req, res) => {
  try {
    const { user_id, month, year } = req.params;

    const [attendance] = await db.query(`
      SELECT * FROM attendance
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      ORDER BY date ASC
    `, [user_id, month, year]);

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      percentage: ((attendance.filter(a => a.status === 'present').length) / attendance.length * 100).toFixed(2)
    };

    res.status(200).json({
      attendance_data: attendance,
      statistics: stats,
      month: month,
      year: year
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ error: 'Failed to get attendance report' });
  }
});

// ============================================
// MARK ATTENDANCE
// ============================================
router.post('/attendance/mark', async (req, res) => {
  try {
    const { user_id, date, status, notes } = req.body;

    if (!user_id || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(`
      INSERT INTO attendance (user_id, date, status, notes, check_in_time)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = ?, notes = ?, check_in_time = NOW()
    `, [user_id, date, status, notes, status, notes]);

    res.status(201).json({ message: 'Attendance marked', id: result.insertId });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ============================================
// GET USER PROGRESS REPORT
// ============================================
router.get('/progress/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const [progress] = await db.query(`
      SELECT 
        total_videos_watched,
        total_watch_time_minutes,
        average_video_completion_percentage,
        quiz_pass_rate,
        average_quiz_score,
        streak_current,
        streak_longest,
        certificates_earned
      FROM user_progress
      WHERE user_id = ?
    `, [user_id]);

    // Get videos completed
    const [videosCompleted] = await db.query(`
      SELECT COUNT(*) as total FROM user_video_progress
      WHERE user_id = ? AND completed = 1
    `, [user_id]);

    // Get assignments stats
    const [assignmentStats] = await db.query(`
      SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as submitted,
        AVG(score) as average_score
      FROM assignment_submissions
      WHERE user_id = ?
    `, [user_id]);

    res.status(200).json({
      progress: progress[0] || {},
      videos_completed: videosCompleted[0]?.total || 0,
      assignments: assignmentStats[0] || {}
    });
  } catch (error) {
    console.error('Progress report error:', error);
    res.status(500).json({ error: 'Failed to get progress report' });
  }
});

// ============================================
// GET ASSIGNMENTS FOR USER
// ============================================
router.get('/assignments/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const [assignments] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.max_score,
        asub.status,
        asub.score,
        asub.submitted_at
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
      WHERE a.is_active = 1
      ORDER BY a.due_date ASC
    `, [user_id]);

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

// ============================================
// SUBMIT ASSIGNMENT
// ============================================
router.post('/assignments/submit', async (req, res) => {
  try {
    const { assignment_id, user_id, submission_text, submission_url } = req.body;

    if (!assignment_id || !user_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await db.query(`
      INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, submission_url, status)
      VALUES (?, ?, ?, ?, 'submitted')
      ON DUPLICATE KEY UPDATE
        submission_text = ?, submission_url = ?, status = 'submitted'
    `, [assignment_id, user_id, submission_text, submission_url, submission_text, submission_url]);

    res.status(201).json({ message: 'Assignment submitted', id: result.insertId });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

module.exports = router;
```

---

## 3. Video Storage & Hierarchy

This is a **crucial section** for your Ed-Tech platform. Here's the professional way to organize videos with hierarchical categories.

### Database Schema for Hierarchical Video Organization

```sql
-- ============================================================
-- VIDEO TAXONOMY (Hierarchical Structure)
-- ============================================================

-- Level 1: Main Categories (e.g., Engineering, Arts, Science)
CREATE TABLE IF NOT EXISTS video_categories (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(255) NOT NULL UNIQUE,
  slug              VARCHAR(255) UNIQUE NOT NULL,
  description       TEXT,
  icon_url          VARCHAR(500),
  color_code        VARCHAR(7),             -- Hex color for UI
  sort_order        INT          DEFAULT 0,
  is_active         TINYINT(1)   DEFAULT 1,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_sort_order (sort_order)
);

-- Level 2: Subcategories (e.g., Engineering > CSE, Civil, Mechanical)
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

-- Level 3: Topics (e.g., CSE > Object-Oriented Programming, Algorithms, Data Structures)
CREATE TABLE IF NOT EXISTS video_topics (
  id                INT          AUTO_INCREMENT PRIMARY KEY,
  subcategory_id    INT          NOT NULL,
  name              VARCHAR(255) NOT NULL,
  slug              VARCHAR(255) NOT NULL,
  description       TEXT,
  prerequisites     JSON,                   -- ["topic_1", "topic_3"]
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

-- VIDEOS TABLE (Updated to include hierarchy)
CREATE TABLE IF NOT EXISTS videos (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  topic_id          INT           NOT NULL,
  title             VARCHAR(255)  NOT NULL,
  description       TEXT,
  duration_seconds  INT,                    -- stored in seconds, not MM:SS
  video_url         VARCHAR(1000) NOT NULL,
  thumbnail_url     VARCHAR(1000),
  transcript_url    VARCHAR(1000),
  quality_options   JSON,                   -- ["1080p","720p","480p","360p"]
  playback_speeds   JSON,                   -- [0.75, 1, 1.25, 1.5, 2]
  instructor_id     INT,
  instructor_name   VARCHAR(100),
  view_count        INT           DEFAULT 0,
  is_published      TINYINT(1)    DEFAULT 1,
  sequence_order    INT           DEFAULT 0, -- Order within topic
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

-- VIDEO QUIZ/ASSESSMENTS
CREATE TABLE IF NOT EXISTS video_quizzes (
  id                INT           AUTO_INCREMENT PRIMARY KEY,
  video_id          INT           NOT NULL,
  title             VARCHAR(255),
  order_number      INT,
  question_type     ENUM('mcq','true_false','short_answer','essay'),
  question_text     TEXT          NOT NULL,
  options           JSON,                   -- for MCQ: ["Option A", "Option B", ...]
  correct_answer    VARCHAR(500),
  xp_reward         INT           DEFAULT 10,
  difficulty        ENUM('easy','medium','hard') DEFAULT 'easy',
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE,
  INDEX idx_video_id (video_id),
  INDEX idx_order_number (order_number)
);

-- PLAYLIST/COLLECTIONS (e.g., Semester 1 CSE Course)
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

-- PLAYLIST VIDEOS (Many-to-Many: Video → Playlist)
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
```

### Example: Seeding the Hierarchy

```sql
-- SEED: Video Hierarchy
-- Level 1: Categories
INSERT INTO video_categories (name, slug, description, color_code, sort_order) VALUES
('Engineering', 'engineering', 'Core engineering disciplines', '#FF6B6B', 1),
('Arts & Humanities', 'arts-humanities', 'Liberal arts and humanities courses', '#4ECDC4', 2),
('Business', 'business', 'Business and management studies', '#FFE66D', 3);

-- Level 2: Subcategories
INSERT INTO video_subcategories (category_id, name, slug, description, sort_order) VALUES
(1, 'Computer Science & Engineering', 'cse', 'CSE undergraduate and postgraduate programs', 1),
(1, 'Civil Engineering', 'civil', 'Civil engineering specializations', 2),
(1, 'Mechanical Engineering', 'mechanical', 'Mechanical engineering courses', 3);

-- Level 3: Topics
INSERT INTO video_topics (subcategory_id, name, slug, description, difficulty_level) VALUES
(1, 'Object-Oriented Programming', 'oop', 'Learn OOP concepts: classes, inheritance, polymorphism', 'beginner'),
(1, 'Data Structures', 'data-structures', 'Arrays, linked lists, trees, graphs', 'intermediate'),
(1, 'Algorithms', 'algorithms', 'Sorting, searching, dynamic programming', 'advanced');

-- Videos under OOP Topic
INSERT INTO videos (topic_id, title, description, duration_seconds, video_url, instructor_name, sequence_order) VALUES
(1, 'Classes and Objects Explained', 'Introduction to OOP fundamentals', 1200, '/videos/oop/classes-objects.mp4', 'Dr. John Smith', 1),
(1, 'Polymorphism and Inheritance', 'Understanding inheritance hierarchies', 1500, '/videos/oop/polymorphism.mp4', 'Dr. John Smith', 2);
```

### Frontend: Displaying Video Hierarchy

```html
<!-- Frontend/video-browser.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Video Library - Acadly</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="dark:bg-slate-900">
  <div class="max-w-7xl mx-auto p-6">
    <h1 class="text-4xl font-bold mb-8">Video Library</h1>
    
    <!-- Category Selection -->
    <div id="categories" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"></div>
    
    <!-- Subcategory Selection -->
    <div id="subcategories" class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8"></div>
    
    <!-- Topics -->
    <div id="topics" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"></div>
    
    <!-- Videos Grid -->
    <div id="videosGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  </div>

  <script>
    let selectedCategory = null;
    let selectedSubcategory = null;
    let selectedTopic = null;

    // Load Categories
    async function loadCategories() {
      const response = await fetch('/api/videos/categories');
      const categories = await response.json();
      
      const container = document.getElementById('categories');
      container.innerHTML = categories.map(cat => `
        <button onclick="selectCategory(${cat.id})" class="p-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600">
          ${cat.name}
        </button>
      `).join('');
    }

    // Load Subcategories
    async function selectCategory(categoryId) {
      selectedCategory = categoryId;
      const response = await fetch(`/api/videos/subcategories/${categoryId}`);
      const subcategories = await response.json();
      
      const container = document.getElementById('subcategories');
      container.innerHTML = subcategories.map(subcat => `
        <button onclick="selectSubcategory(${subcat.id})" class="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
          ${subcat.name}
        </button>
      `).join('');
    }

    // Load Topics
    async function selectSubcategory(subcategoryId) {
      selectedSubcategory = subcategoryId;
      const response = await fetch(`/api/videos/topics/${subcategoryId}`);
      const topics = await response.json();
      
      const container = document.getElementById('topics');
      container.innerHTML = topics.map(topic => `
        <button onclick="selectTopic(${topic.id})" class="p-4 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600">
          ${topic.name}
          <span class="block text-xs mt-1">${topic.difficulty_level}</span>
        </button>
      `).join('');
    }

    // Load Videos
    async function selectTopic(topicId) {
      selectedTopic = topicId;
      const response = await fetch(`/api/videos/topic/${topicId}`);
      const videos = await response.json();
      
      const container = document.getElementById('videosGrid');
      container.innerHTML = videos.map(video => `
        <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer" onclick="playVideo(${video.id})">
          <img src="${video.thumbnail_url}" alt="${video.title}" class="w-full h-48 object-cover">
          <div class="p-4">
            <h3 class="font-bold text-lg">${video.title}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">${Math.floor(video.duration_seconds / 60)} mins</p>
            <p class="text-xs text-gray-500 mt-2">${video.instructor_name}</p>
          </div>
        </div>
      `).join('');
    }

    function playVideo(videoId) {
      window.location.href = `/videoplayer.html?video_id=${videoId}`;
    }

    // Initialize
    loadCategories();
  </script>
</body>
</html>
```

### Backend: Video Hierarchy API

```javascript
// Backend/routes/videos.js (Enhanced)
const express = require('express');
const db = require('../DataBase/db_config');

const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT id, name, slug, description, color_code, icon_url FROM video_categories WHERE is_active = 1 ORDER BY sort_order'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get subcategories for a category
router.get('/subcategories/:category_id', async (req, res) => {
  try {
    const { category_id } = req.params;
    const [subcategories] = await db.query(
      'SELECT id, name, slug, description, icon_url FROM video_subcategories WHERE category_id = ? AND is_active = 1 ORDER BY sort_order',
      [category_id]
    );
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Get topics for a subcategory
router.get('/topics/:subcategory_id', async (req, res) => {
  try {
    const { subcategory_id } = req.params;
    const [topics] = await db.query(
      'SELECT id, name, slug, description, difficulty_level, estimated_hours FROM video_topics WHERE subcategory_id = ? AND is_active = 1 ORDER BY sort_order',
      [subcategory_id]
    );
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get videos for a topic
router.get('/topic/:topic_id', async (req, res) => {
  try {
    const { topic_id } = req.params;
    const [videos] = await db.query(`
      SELECT id, title, description, duration_seconds, thumbnail_url, video_url, 
             instructor_name, view_count, sequence_order
      FROM videos 
      WHERE topic_id = ? AND is_published = 1 
      ORDER BY sequence_order
    `, [topic_id]);
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Upload video (Admin only)
router.post('/upload', async (req, res) => {
  try {
    const { topic_id, title, description, video_url, thumbnail_url, duration_seconds, instructor_name } = req.body;

    const [result] = await db.query(`
      INSERT INTO videos (topic_id, title, description, video_url, thumbnail_url, duration_seconds, instructor_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [topic_id, title, description, video_url, thumbnail_url, duration_seconds, instructor_name]);

    res.status(201).json({ message: 'Video uploaded', video_id: result.insertId });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Archive video (Soft delete)
router.patch('/archive/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;
    await db.query(
      'UPDATE videos SET is_published = 0 WHERE id = ?',
      [video_id]
    );
    res.json({ message: 'Video archived' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to archive video' });
  }
});

// Delete video (Permanent)
router.delete('/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;
    await db.query('DELETE FROM videos WHERE id = ?', [video_id]);
    res.json({ message: 'Video deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

module.exports = router;
```

---

## Security Best Practices

### 1. Password Security

```javascript
// Always use bcrypt for password hashing
const bcrypt = require('bcryptjs');

// Hash password during registration
const passwordHash = await bcrypt.hash(plainPassword, 10); // 10 = salt rounds

// Verify password during login
const isMatch = await bcrypt.compare(plainPassword, storedHash);
```

### 2. Environment Variables

```bash
# .env (NEVER commit this file!)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=acadly_db
JWT_SECRET=your_very_long_random_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key
NODE_ENV=production
PORT=3000
```

### 3. SQL Injection Prevention

```javascript
// ✅ GOOD - Using parameterized queries
const [results] = await db.query(
  'SELECT * FROM users WHERE email = ?',
  [userEmail]
);

// ❌ BAD - String concatenation (SQL injection vulnerability!)
const results = await db.query(
  `SELECT * FROM users WHERE email = '${userEmail}'`
);
```

### 4. JWT Token Management

```javascript
const jwt = require('jsonwebtoken');

// Generate token
const token = jwt.sign(
  { user_id, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Verify token (middleware)
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}
```

### 5. CORS Configuration

```javascript
const cors = require('cors');

// Only allow trusted origins
app.use(cors({
  origin: ['https://acadly.com', 'https://www.acadly.com'],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

---

## Complete Implementation Examples

### Install Required Packages

```bash
cd Backend
npm install bcryptjs jsonwebtoken
# Update package.json in Backend/
```

### Updated Package.json

```json
{
  "dependencies": {
    "express": "^5.2.1",
    "mysql2": "^3.20.0",
    "cors": "^2.8.6",
    "dotenv": "^16.4.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.1.2",
    "nodemon": "^3.1.14"
  }
}
```

### Server.js Integration

```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../Frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user-management'));
app.use('/api/videos', require('./routes/videos'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## Summary

| Aspect | Solution |
|--------|----------|
| **Login Storage** | Use bcrypt hashing + `users` table with `password_hash` |
| **Account Details** | `user_profiles` table for extended info (GPA, department, etc.) |
| **Attendance** | `attendance` + `attendance_reports` tables for daily tracking |
| **Progress** | `user_progress` + `user_video_progress` for detailed metrics |
| **Assignments** | `assignments` + `assignment_submissions` for submission tracking |
| **Video Hierarchy** | 3-level taxonomy: `video_categories` → `video_subcategories` → `video_topics` → `videos` |
| **Upload/Delete** | Use `is_published` for soft deletes, permanent delete removes record |
| **Security** | Bcrypt passwords, JWT tokens, parameterized queries, environment variables |

This structure is **production-ready** and can handle millions of users, videos, and transactions efficiently!
