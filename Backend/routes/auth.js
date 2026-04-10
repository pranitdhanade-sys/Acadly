// Backend/routes/auth.js
// Authentication routes: registration, login, logout, password reset

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db_config');
const { logUserActivity } = require('../middleware_auth');

const router = express.Router();
const isProduction = process.env.NODE_ENV === 'production';

function getCookieOptions(maxAgeMs) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeMs
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate JWT Tokens
function generateTokens(userId, email, role) {
  const accessToken = jwt.sign(
    { user_id: userId, email, role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { user_id: userId },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePassword(password) {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}

// ============================================
// 1. USER REGISTRATION
// ============================================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'student' } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, password, and name are required' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' 
      });
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
      `INSERT INTO users (email, password_hash, password, name, role, is_active) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [email, passwordHash, passwordHash, name, role]
    );

    const userId = result.insertId;

    // Create user profile
    await db.query(
      'INSERT INTO user_profiles (user_id, xp_total, streak_days) VALUES (?, 0, 0)',
      [userId]
    );

    // Create user progress record
    await db.query(
      'INSERT INTO user_progress (user_id) VALUES (?)',
      [userId]
    );

    // Log registration
    await db.query(
      `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, 'success', req.ip, 'Registration']
    );

    res.status(201).json({
      message: 'Registration successful',
      user_id: userId,
      email: email,
      role: role
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

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const [users] = await db.query(
      `SELECT id, COALESCE(password_hash, password) AS password_hash, name, role, is_active, locked_until, COALESCE(login_attempts, 0) AS login_attempts 
       FROM users WHERE email = ?`,
      [email]
    );

    if (users.length === 0) {
      // Log failed attempt
      await db.query(
        `INSERT INTO login_audit (email, status, ip_address, reason) 
         VALUES (?, ?, ?, ?)`,
        [email, 'failed', req.ip, 'User not found']
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      await db.query(
        `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, email, 'locked', req.ip, 'Account locked']
      );
      return res.status(403).json({ error: 'Account temporarily locked. Try again later.' });
    }

    // Check if account is active
    if (!user.is_active) {
      await db.query(
        `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, email, 'failed', req.ip, 'Account inactive']
      );
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      // Increment login attempts
      const attempts = user.login_attempts + 1;

      if (attempts >= 5) {
        // Lock account for 15 minutes
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await db.query(
          'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
          [attempts, lockedUntil, user.id]
        );

        await db.query(
          `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
           VALUES (?, ?, ?, ?, ?)`,
          [user.id, email, 'locked', req.ip, `Account locked after ${attempts} failed attempts`]
        );

        return res.status(403).json({ error: 'Too many failed attempts. Account locked for 15 minutes.' });
      }

      await db.query(
        'UPDATE users SET login_attempts = ? WHERE id = ?',
        [attempts, user.id]
      );

      await db.query(
        `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, email, 'failed', req.ip, `Invalid password (attempt ${attempts}/5)`]
      );

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Password matches - Reset login attempts
    await db.query(
      'UPDATE users SET login_attempts = 0, last_login = NOW(), last_ip_address = ? WHERE id = ?',
      [req.ip, user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, email, user.role);

    // Store session in database
    await db.query(
      `INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, ?)`,
      [user.id, accessToken, refreshToken, req.ip, req.get('user-agent')]
    );

    // Log successful login
    await db.query(
      `INSERT INTO login_audit (user_id, email, status, ip_address, reason) 
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, email, 'success', req.ip, 'Login successful']
    );

    await logUserActivity(user.id, 'auth.login.success', { ip: req.ip, user_agent: req.get('user-agent') });

    // Get user full profile
    const [profile] = await db.query(
      'SELECT xp_total, level, badges_earned FROM user_profiles WHERE user_id = ?',
      [user.id]
    );

    res.cookie('acadly_access_token', accessToken, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('acadly_refresh_token', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(200).json({
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: email,
        name: user.name,
        role: user.role,
        xp: profile[0]?.xp_total || 0,
        level: profile[0]?.level || 1,
        badges: profile[0]?.badges_earned || []
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// 3. REFRESH TOKEN
// ============================================
router.post('/refresh', async (req, res) => {
  try {
    const refreshTokenFromCookie = req.cookies?.acadly_refresh_token;
    const { refresh_token: refreshTokenFromBody } = req.body;
    const refresh_token = refreshTokenFromBody || refreshTokenFromCookie;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
    );

    // Check if session exists in DB
    const [sessions] = await db.query(
      'SELECT user_id FROM user_sessions WHERE refresh_token = ? AND expires_at > NOW()',
      [refresh_token]
    );

    if (sessions.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user details
    const [users] = await db.query(
      'SELECT email, role FROM users WHERE id = ?',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const { accessToken: newAccessToken } = generateTokens(
      decoded.user_id,
      users[0].email,
      users[0].role
    );

    res.cookie('acadly_access_token', newAccessToken, getCookieOptions(24 * 60 * 60 * 1000));

    res.status(200).json({
      access_token: newAccessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
});

// ============================================
// 4. LOGOUT
// ============================================
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.acadly_access_token;

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    // Verify and decode token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Delete session from database
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = ? AND session_token = ?',
      [decoded.user_id, token]
    );

    res.clearCookie('acadly_access_token', { path: '/' });
    res.clearCookie('acadly_refresh_token', { path: '/' });
    res.status(200).json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================
// 5. REQUEST PASSWORD RESET
// ============================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user
    const [users] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal if email exists
      return res.status(200).json({ message: 'If email exists, reset link will be sent' });
    }

    const userId = users[0].id;

    // Generate reset token
    const resetToken = jwt.sign(
      { user_id: userId, type: 'reset' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Store reset token
    await db.query(
      `INSERT INTO password_resets (user_id, reset_token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))
       ON DUPLICATE KEY UPDATE reset_token = ?, expires_at = DATE_ADD(NOW(), INTERVAL 1 HOUR)`,
      [userId, resetToken, resetToken]
    );

    // TODO: Send email with reset link
    // Example: await sendResetEmail(email, resetToken);

    res.status(200).json({ 
      message: 'If email exists, reset link will be sent',
      // For testing only - remove in production
      reset_token: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
});

// ============================================
// 6. RESET PASSWORD
// ============================================
router.post('/reset-password', async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;

    if (!reset_token || !new_password) {
      return res.status(400).json({ error: 'Reset token and new password required' });
    }

    if (!validatePassword(new_password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and numbers' 
      });
    }

    // Verify reset token
    const decoded = jwt.verify(
      reset_token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Check if token exists in DB
    const [resets] = await db.query(
      'SELECT user_id FROM password_resets WHERE user_id = ? AND reset_token = ? AND expires_at > NOW()',
      [decoded.user_id, reset_token]
    );

    if (resets.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, decoded.user_id]
    );

    // Delete reset token
    await db.query(
      'DELETE FROM password_resets WHERE user_id = ?',
      [decoded.user_id]
    );

    // Invalidate all sessions
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [decoded.user_id]
    );

    res.status(200).json({ message: 'Password reset successful. Please login with new password.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(403).json({ error: 'Invalid or expired reset token' });
  }
});

// ============================================
// 7. VERIFY TOKEN (Middleware utility)
// ============================================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.acadly_access_token;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );

    // Check if session is valid
    const [sessions] = await db.query(
      'SELECT id FROM user_sessions WHERE user_id = ? AND session_token = ? AND expires_at > NOW()',
      [decoded.user_id, token]
    );

    if (sessions.length === 0) {
      return res.status(403).json({ error: 'Session expired or invalid' });
    }

    await logUserActivity(decoded.user_id, 'auth.token.verify', { ip: req.ip });

    res.status(200).json({
      valid: true,
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role
    });

  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

module.exports = router;
