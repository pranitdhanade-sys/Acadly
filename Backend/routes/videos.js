// Backend/routes/videos.js
// Video management with hierarchical categories, upload, and deletion

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
// 1. GET ALL CATEGORIES
// ============================================
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT id, name, slug, description, color_code, icon_url, sort_order 
       FROM video_categories 
       WHERE is_active = 1 
       ORDER BY sort_order ASC, name ASC`
    );

    res.status(200).json(categories);

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ============================================
// 2. GET SUBCATEGORIES FOR A CATEGORY
// ============================================
router.get('/categories/:category_id/subcategories', async (req, res) => {
  try {
    const { category_id } = req.params;

    // Verify category exists
    const [category] = await db.query(
      'SELECT id FROM video_categories WHERE id = ? AND is_active = 1',
      [category_id]
    );

    if (category.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get subcategories
    const [subcategories] = await db.query(
      `SELECT id, name, slug, description, icon_url, sort_order 
       FROM video_subcategories 
       WHERE category_id = ? AND is_active = 1 
       ORDER BY sort_order ASC, name ASC`,
      [category_id]
    );

    res.status(200).json(subcategories);

  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// Shorthand route for convenience
router.get('/subcategories/:category_id', async (req, res) => {
  const { category_id } = req.params;
  try {
    const [subcategories] = await db.query(
      `SELECT id, name, slug, description, icon_url, sort_order 
       FROM video_subcategories 
       WHERE category_id = ? AND is_active = 1 
       ORDER BY sort_order ASC`,
      [category_id]
    );
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
});

// ============================================
// 3. GET TOPICS FOR A SUBCATEGORY
// ============================================
router.get('/subcategories/:subcategory_id/topics', async (req, res) => {
  try {
    const { subcategory_id } = req.params;

    // Verify subcategory exists
    const [subcategory] = await db.query(
      'SELECT id FROM video_subcategories WHERE id = ? AND is_active = 1',
      [subcategory_id]
    );

    if (subcategory.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }

    // Get topics
    const [topics] = await db.query(
      `SELECT id, name, slug, description, difficulty_level, estimated_hours, sort_order 
       FROM video_topics 
       WHERE subcategory_id = ? AND is_active = 1 
       ORDER BY sort_order ASC, name ASC`,
      [subcategory_id]
    );

    res.status(200).json(topics);

  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Shorthand route for convenience
router.get('/topics/:subcategory_id', async (req, res) => {
  const { subcategory_id } = req.params;
  try {
    const [topics] = await db.query(
      `SELECT id, name, slug, description, difficulty_level, estimated_hours, sort_order 
       FROM video_topics 
       WHERE subcategory_id = ? AND is_active = 1 
       ORDER BY sort_order ASC`,
      [subcategory_id]
    );
    res.json(topics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// ============================================
// 4. GET VIDEOS FOR A TOPIC
// ============================================
router.get('/topics/:topic_id/videos', async (req, res) => {
  try {
    const { topic_id } = req.params;

    // Verify topic exists
    const [topic] = await db.query(
      'SELECT id FROM video_topics WHERE id = ? AND is_active = 1',
      [topic_id]
    );

    if (topic.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get videos
    const [videos] = await db.query(
      `SELECT id, title, description, duration_seconds, thumbnail_url, video_url,
              instructor_name, view_count, sequence_order, is_published
       FROM videos 
       WHERE topic_id = ? AND is_published = 1 
       ORDER BY sequence_order ASC`,
      [topic_id]
    );

    res.status(200).json(videos);

  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Shorthand route for convenience  
router.get('/topic/:topic_id', async (req, res) => {
  const { topic_id } = req.params;
  try {
    const [videos] = await db.query(
      `SELECT id, title, description, duration_seconds, thumbnail_url, video_url,
              instructor_name, view_count, sequence_order
       FROM videos 
       WHERE topic_id = ? AND is_published = 1 
       ORDER BY sequence_order ASC`,
      [topic_id]
    );
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// ============================================
// 5. GET SINGLE VIDEO DETAILS
// ============================================
router.get('/:video_id', async (req, res) => {
  try {
    const { video_id } = req.params;

    // Get video details
    const [videos] = await db.query(`
      SELECT 
        v.id, v.title, v.description, v.duration_seconds, v.video_url, 
        v.thumbnail_url, v.transcript_url, v.quality_options, v.playback_speeds,
        v.instructor_name, v.view_count, v.sequence_order,
        t.name as topic_name, s.name as subcategory_name, c.name as category_name
      FROM videos v
      JOIN video_topics t ON v.topic_id = t.id
      JOIN video_subcategories s ON t.subcategory_id = s.id
      JOIN video_categories c ON s.category_id = c.id
      WHERE v.id = ? AND v.is_published = 1
    `, [video_id]);

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Get video tracks (subtitles)
    const [tracks] = await db.query(
      `SELECT id, kind, label, srclang, src, is_default 
       FROM video_tracks 
       WHERE video_id = ?`,
      [video_id]
    );

    // Get related quizzes
    const [quizzes] = await db.query(
      `SELECT id, question_type, question_text, options, correct_answer, 
              xp_reward, difficulty, order_number
       FROM video_quizzes 
       WHERE video_id = ? 
       ORDER BY order_number ASC`,
      [video_id]
    );

    // Increment view count
    await db.query(
      'UPDATE videos SET view_count = view_count + 1 WHERE id = ?',
      [video_id]
    );

    res.status(200).json({
      ...videos[0],
      tracks: tracks,
      quizzes: quizzes
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// ============================================
// 6. SEARCH VIDEOS
// ============================================
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const [videos] = await db.query(`
      SELECT id, title, description, duration_seconds, thumbnail_url, 
             instructor_name, view_count
      FROM videos 
      WHERE (title LIKE ? OR description LIKE ?) AND is_published = 1
      ORDER BY view_count DESC
      LIMIT 20
    `, [`%${query}%`, `%${query}%`]);

    res.status(200).json(videos);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ============================================
// 7. UPLOAD NEW VIDEO (Admin/Teacher only)
// ============================================
router.post('/upload', verifyToken, async (req, res) => {
  try {
    // Only admin and teachers can upload
    if (req.user_role !== 'admin' && req.user_role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { 
      topic_id, title, description, video_url, thumbnail_url, 
      duration_seconds, instructor_name, quality_options, playback_speeds 
    } = req.body;

    // Validation
    if (!topic_id || !title || !video_url) {
      return res.status(400).json({ 
        error: 'Topic ID, title, and video URL required' 
      });
    }

    // Verify topic exists
    const [topics] = await db.query(
      'SELECT id FROM video_topics WHERE id = ? AND is_active = 1',
      [topic_id]
    );

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get next sequence order for this topic
    const [lastVideo] = await db.query(
      'SELECT MAX(sequence_order) as max_order FROM videos WHERE topic_id = ?',
      [topic_id]
    );

    const nextOrder = (lastVideo[0]?.max_order || 0) + 1;

    // Insert video
    const [result] = await db.query(`
      INSERT INTO videos (
        topic_id, title, description, video_url, thumbnail_url, 
        duration_seconds, instructor_name, quality_options, playback_speeds,
        sequence_order, created_by, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      topic_id, title, description, video_url, thumbnail_url,
      duration_seconds, instructor_name, 
      JSON.stringify(quality_options || ['1080p', '720p', '480p']),
      JSON.stringify(playback_speeds || [1]),
      nextOrder, req.user_id
    ]);

    res.status(201).json({ 
      message: 'Video uploaded successfully',
      video_id: result.insertId
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// ============================================
// 8. UPDATE VIDEO (Admin/Teacher only)
// ============================================
router.put('/:video_id', verifyToken, async (req, res) => {
  try {
    // Only admin and teachers can update
    if (req.user_role !== 'admin' && req.user_role !== 'teacher') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { video_id } = req.params;
    const { title, description, instructor_name, thumbnail_url } = req.body;

    // Verify video exists and user created it or is admin
    const [videos] = await db.query(
      'SELECT created_by FROM videos WHERE id = ?',
      [video_id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (req.user_role !== 'admin' && videos[0].created_by !== req.user_id) {
      return res.status(403).json({ error: 'You can only edit your own videos' });
    }

    // Update video
    await db.query(`
      UPDATE videos 
      SET title = IFNULL(?, title), 
          description = IFNULL(?, description),
          instructor_name = IFNULL(?, instructor_name),
          thumbnail_url = IFNULL(?, thumbnail_url),
          updated_at = NOW()
      WHERE id = ?
    `, [title, description, instructor_name, thumbnail_url, video_id]);

    res.status(200).json({ message: 'Video updated successfully' });

  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// ============================================
// 9. ARCHIVE VIDEO (Soft Delete - Admin only)
// ============================================
router.patch('/:video_id/archive', verifyToken, async (req, res) => {
  try {
    // Only admin can archive
    if (req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { video_id } = req.params;

    // Verify video exists
    const [videos] = await db.query(
      'SELECT id FROM videos WHERE id = ?',
      [video_id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Archive video (set is_published to 0)
    await db.query(
      'UPDATE videos SET is_published = 0, updated_at = NOW() WHERE id = ?',
      [video_id]
    );

    res.status(200).json({ message: 'Video archived successfully' });

  } catch (error) {
    console.error('Archive video error:', error);
    res.status(500).json({ error: 'Failed to archive video' });
  }
});

// ============================================
// 10. UNARCHIVE VIDEO (Admin only)
// ============================================
router.patch('/:video_id/unarchive', verifyToken, async (req, res) => {
  try {
    // Only admin can unarchive
    if (req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { video_id } = req.params;

    // Verify video exists
    const [videos] = await db.query(
      'SELECT id FROM videos WHERE id = ?',
      [video_id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Unarchive video
    await db.query(
      'UPDATE videos SET is_published = 1, updated_at = NOW() WHERE id = ?',
      [video_id]
    );

    res.status(200).json({ message: 'Video restored successfully' });

  } catch (error) {
    console.error('Unarchive video error:', error);
    res.status(500).json({ error: 'Failed to restore video' });
  }
});

// ============================================
// 11. DELETE VIDEO (Permanent - Admin only)
// ============================================
router.delete('/:video_id', verifyToken, async (req, res) => {
  try {
    // Only admin can permanently delete
    if (req.user_role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { video_id } = req.params;

    // Verify video exists
    const [videos] = await db.query(
      'SELECT id FROM videos WHERE id = ?',
      [video_id]
    );

    if (videos.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete video (cascades to tracks, progress, quizzes)
    await db.query('DELETE FROM videos WHERE id = ?', [video_id]);

    res.status(200).json({ message: 'Video deleted permanently' });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ============================================
// 12. TRACK VIDEO WATCH PROGRESS
// ============================================
router.post('/:video_id/progress', verifyToken, async (req, res) => {
  try {
    const { video_id } = req.params;
    const { watch_seconds, completed, quiz_score } = req.body;
    const user_id = req.user_id;

    // Insert or update progress
    const [result] = await db.query(`
      INSERT INTO user_video_progress (user_id, video_id, watch_seconds, completed, quiz_score)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        watch_seconds = ?, completed = ?, quiz_score = ?, last_watched = NOW()
    `, [
      user_id, video_id, watch_seconds || 0, completed || 0, quiz_score || 0,
      watch_seconds || 0, completed || 0, quiz_score || 0
    ]);

    // Update user progress stats if video completed
    if (completed) {
      await db.query(`
        UPDATE user_progress 
        SET total_videos_watched = total_videos_watched + 1,
            total_watch_time_minutes = total_watch_time_minutes + ?
        WHERE user_id = ?
      `, [Math.floor(watch_seconds / 60), user_id]);

      // Award XP
      const xpReward = 50; // Base XP for completing video
      await db.query(`
        UPDATE user_profiles 
        SET xp_total = xp_total + ?
        WHERE user_id = ?
      `, [xpReward, user_id]);

      // Update XP in video progress
      await db.query(`
        UPDATE user_video_progress 
        SET xp_awarded = ?
        WHERE user_id = ? AND video_id = ?
      `, [xpReward, user_id, video_id]);
    }

    res.status(200).json({ message: 'Progress tracked' });

  } catch (error) {
    console.error('Track progress error:', error);
    res.status(500).json({ error: 'Failed to track progress' });
  }
});

// ============================================
// 13. GET USER'S VIDEO PROGRESS
// ============================================
router.get('/:video_id/user-progress', verifyToken, async (req, res) => {
  try {
    const { video_id } = req.params;
    const user_id = req.user_id;

    const [progress] = await db.query(`
      SELECT watch_seconds, completed, quiz_score, xp_awarded, last_watched
      FROM user_video_progress
      WHERE user_id = ? AND video_id = ?
    `, [user_id, video_id]);

    res.status(200).json(progress[0] || {
      watch_seconds: 0,
      completed: 0,
      quiz_score: 0,
      xp_awarded: 0
    });

  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

module.exports = router;
