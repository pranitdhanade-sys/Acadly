// Backend/routes/user-management.js
// User dashboard, attendance, and progress tracking

const express = require('express');
const db = require('../DataBase/db_config');

const router = express.Router();

// ============================================
// HELPER: Verify JWT Token Middleware
// ============================================
async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    );
    
    req.user_id = decoded.user_id;
    req.user_role = decoded.role;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// ============================================
// 1. GET USER DASHBOARD DATA
// ============================================
router.get('/dashboard/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify user can only see their own dashboard or admin can see anyone
    if (req.user_id !== parseInt(user_id) && req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get user profile
    const [userProfile] = await db.query(`
      SELECT u.name, u.email, u.role, u.avatar_url, 
             up.xp_total, up.streak_days, up.level, up.gpa, 
             up.department, up.badges_earned
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ? AND u.is_active = 1
    `, [user_id]);

    if (userProfile.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current month attendance
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [currentMonthAttendance] = await db.query(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused
      FROM attendance
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
    `, [user_id, currentMonth, currentYear]);

    // Get progress stats
    const [progressStats] = await db.query(`
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

    // Get recent activity (last 5 videos watched)
    const [recentActivity] = await db.query(`
      SELECT uvp.last_watched, v.title, uvp.completed, uvp.watch_seconds, v.duration_seconds
      FROM user_video_progress uvp
      JOIN videos v ON uvp.video_id = v.id
      WHERE uvp.user_id = ?
      ORDER BY uvp.last_watched DESC
      LIMIT 5
    `, [user_id]);

    // Get pending assignments
    const [pendingAssignments] = await db.query(`
      SELECT a.id, a.title, a.due_date, a.max_score
      FROM assignments a
      LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.user_id = ?
      WHERE a.is_active = 1 AND (asub.status IS NULL OR asub.status = 'pending')
      AND a.due_date > NOW()
      ORDER BY a.due_date ASC
      LIMIT 3
    `, [user_id]);

    res.status(200).json({
      user: userProfile[0],
      attendance: {
        current_month: currentMonthAttendance[0] || {},
        month: currentMonth,
        year: currentYear
      },
      progress: progressStats[0] || {},
      recent_activity: recentActivity || [],
      pending_assignments: pendingAssignments || []
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// ============================================
// 2. GET ATTENDANCE REPORT FOR A MONTH
// ============================================
router.get('/attendance/:user_id/:month/:year', verifyToken, async (req, res) => {
  try {
    const { user_id, month, year } = req.params;

    // Verify authorization
    if (req.user_id !== parseInt(user_id) && req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch attendance records
    const [attendance] = await db.query(`
      SELECT id, date, check_in_time, check_out_time, status, duration_minutes, notes
      FROM attendance
      WHERE user_id = ? AND MONTH(date) = ? AND YEAR(date) = ?
      ORDER BY date ASC
    `, [user_id, month, year]);

    // Calculate statistics
    const stats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      excused: attendance.filter(a => a.status === 'excused').length,
      percentage: attendance.length > 0 
        ? (attendance.filter(a => a.status === 'present').length / attendance.length * 100).toFixed(2)
        : 0
    };

    res.status(200).json({
      attendance_data: attendance,
      statistics: stats,
      month: parseInt(month),
      year: parseInt(year)
    });

  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({ error: 'Failed to get attendance report' });
  }
});

// ============================================
// 3. MARK ATTENDANCE (Admin/Teacher only)
// ============================================
router.post('/attendance/mark', verifyToken, async (req, res) => {
  try {
    // Only admin and teachers can mark attendance
    if (req.user_role !== 'admin' && req.user_role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { user_id, date, status, notes } = req.body;

    // Validation
    if (!user_id || !date || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Insert or update attendance
    const [result] = await db.query(`
      INSERT INTO attendance (user_id, date, status, notes, check_in_time)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        status = ?, notes = ?, check_in_time = NOW()
    `, [user_id, date, status, notes || null, status, notes || null]);

    res.status(201).json({ 
      message: 'Attendance marked successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ============================================
// 4. BULK MARK ATTENDANCE
// ============================================
router.post('/attendance/bulk-mark', verifyToken, async (req, res) => {
  try {
    // Only admin and teachers can mark attendance
    if (req.user_role !== 'admin' && req.user_role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { attendanceData } = req.body; // Array of {user_id, date, status}

    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ error: 'Invalid attendance data' });
    }

    // Insert all records
    for (const record of attendanceData) {
      const { user_id, date, status, notes } = record;
      
      if (!user_id || !date || !status) continue;

      await db.query(`
        INSERT INTO attendance (user_id, date, status, notes, check_in_time)
        VALUES (?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          status = ?, notes = ?, check_in_time = NOW()
      `, [user_id, date, status, notes || null, status, notes || null]);
    }

    res.status(201).json({ 
      message: `Attendance marked for ${attendanceData.length} records`
    });

  } catch (error) {
    console.error('Bulk mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// ============================================
// 5. GET USER PROGRESS REPORT
// ============================================
router.get('/progress/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify authorization
    if (req.user_id !== parseInt(user_id) && req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get overall progress
    const [progress] = await db.query(`
      SELECT 
        total_videos_watched,
        total_watch_time_minutes,
        average_video_completion_percentage,
        quiz_pass_rate,
        average_quiz_score,
        streak_current,
        streak_longest,
        certificates_earned,
        last_updated
      FROM user_progress
      WHERE user_id = ?
    `, [user_id]);

    // Get videos completed this month
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [videosCompletedMonth] = await db.query(`
      SELECT COUNT(*) as total FROM user_video_progress
      WHERE user_id = ? AND completed = 1 
      AND MONTH(last_watched) = ? AND YEAR(last_watched) = ?
    `, [user_id, currentMonth, currentYear]);

    // Get assignments stats
    const [assignmentStats] = await db.query(`
      SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as submitted,
        AVG(score) as average_score
      FROM assignment_submissions
      WHERE user_id = ?
    `, [user_id]);

    // Get quiz performance
    const [quizPerformance] = await db.query(`
      SELECT 
        COUNT(DISTINCT video_id) as videos_with_quiz,
        COUNT(*) as total_quiz_attempts,
        AVG(quiz_score * 100) as average_score
      FROM user_video_progress
      WHERE user_id = ? AND quiz_score > 0
    `, [user_id]);

    res.status(200).json({
      progress: progress[0] || {},
      videos_completed_this_month: videosCompletedMonth[0]?.total || 0,
      assignments: assignmentStats[0] || {},
      quiz_performance: quizPerformance[0] || {}
    });

  } catch (error) {
    console.error('Progress report error:', error);
    res.status(500).json({ error: 'Failed to get progress report' });
  }
});

// ============================================
// 6. GET USER'S ASSIGNMENTS
// ============================================
router.get('/assignments/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify authorization
    if (req.user_id !== parseInt(user_id) && req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [assignments] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.due_date,
        a.max_score,
        asub.status,
        asub.score,
        asub.submitted_at,
        asub.feedback,
        asub.id as submission_id,
        CASE 
          WHEN a.due_date < NOW() THEN 'overdue'
          WHEN a.due_date > DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'upcoming'
          ELSE 'due_soon'
        END as urgency
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
// 7. SUBMIT ASSIGNMENT
// ============================================
router.post('/assignments/submit', verifyToken, async (req, res) => {
  try {
    const { assignment_id, submission_text, submission_url } = req.body;
    const user_id = req.user_id;

    // Validation
    if (!assignment_id) {
      return res.status(400).json({ error: 'Assignment ID required' });
    }

    if (!submission_text && !submission_url) {
      return res.status(400).json({ error: 'Submission text or URL required' });
    }

    // Check if assignment exists and is active
    const [assignments] = await db.query(
      'SELECT id, due_date FROM assignments WHERE id = ? AND is_active = 1',
      [assignment_id]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check if deadline has passed
    if (new Date(assignments[0].due_date) < new Date()) {
      return res.status(400).json({ error: 'Assignment deadline has passed' });
    }

    // Submit assignment
    const [result] = await db.query(`
      INSERT INTO assignment_submissions (assignment_id, user_id, submission_text, submission_url, status)
      VALUES (?, ?, ?, ?, 'submitted')
      ON DUPLICATE KEY UPDATE
        submission_text = ?, submission_url = ?, status = 'submitted', submitted_at = NOW()
    `, [assignment_id, user_id, submission_text, submission_url, submission_text, submission_url]);

    res.status(201).json({ 
      message: 'Assignment submitted successfully',
      submission_id: result.insertId
    });

  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// ============================================
// 8. GET USER PROFILE
// ============================================
router.get('/profile/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    // Verify authorization
    if (req.user_id !== parseInt(user_id) && req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const [profile] = await db.query(`
      SELECT 
        u.id, u.email, u.name, u.role, u.avatar_url, u.phone, u.date_of_birth, u.gender,
        up.bio, up.department, up.semester, up.gpa, up.xp_total, up.streak_days, 
        up.level, up.badges_earned
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ? AND u.is_active = 1
    `, [user_id]);

    if (profile.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(profile[0]);

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// ============================================
// 9. UPDATE USER PROFILE
// ============================================
router.put('/profile/:user_id', verifyToken, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { phone, date_of_birth, gender, bio, department, semester } = req.body;

    // Verify authorization - users can only update their own profile
    if (req.user_id !== parseInt(user_id)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update user basic info
    await db.query(`
      UPDATE users 
      SET phone = IFNULL(?, phone), date_of_birth = IFNULL(?, date_of_birth), gender = IFNULL(?, gender)
      WHERE id = ?
    `, [phone, date_of_birth, gender, user_id]);

    // Update profile extended info
    await db.query(`
      UPDATE user_profiles 
      SET bio = IFNULL(?, bio), department = IFNULL(?, department), semester = IFNULL(?, semester)
      WHERE user_id = ?
    `, [bio, department, semester, user_id]);

    res.status(200).json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
