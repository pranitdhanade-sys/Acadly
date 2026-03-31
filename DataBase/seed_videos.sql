-- ============================================================
--  Acadly — AI Learning Video Seed Data  (3 videos)
--  Run AFTER schema.sql.
--  Clears any previous video data then inserts the current set.
-- ============================================================

USE acadly_db;

-- Remove old video data cleanly (foreign-key safe)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE video_tracks;
TRUNCATE TABLE user_video_progress;
TRUNCATE TABLE videos;
SET FOREIGN_KEY_CHECKS = 1;

-- -------------------------------------------------------
-- Video 1 — Intro to Machine Learning  (kept)
-- -------------------------------------------------------
INSERT INTO videos
  (id, title, topic, description, duration, src, thumbnail, quality, playback_speeds, is_published, sort_order)
VALUES (
  1,
  'Intro to Machine Learning',
  'AI Foundations',
  'A beginner-friendly overview of how machines learn from data, covering supervised and unsupervised learning with real-world examples.',
  '12:34',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["1080p","720p","480p"]',
  '[0.75,1,1.25,1.5,2]',
  1, 1
);

-- Subtitle track for Video 1
INSERT INTO video_tracks (video_id, kind, label, srclang, src, is_default)
VALUES (1, 'subtitles', 'English', 'en',
  'https://gist.githubusercontent.com/benkules/0e9eafbd6f66a8d89f5cb9184160a95c/raw/sample-en.vtt',
  1);

-- -------------------------------------------------------
-- Video 2 — Neural Networks Explained  (new)
-- -------------------------------------------------------
INSERT INTO videos
  (id, title, topic, description, duration, src, thumbnail, quality, playback_speeds, is_published, sort_order)
VALUES (
  2,
  'Neural Networks Explained',
  'Deep Learning',
  'A clear walkthrough of how neural networks learn, covering layers, weights, activation functions, and backpropagation with visual examples.',
  '18:45',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  'https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["1080p","720p","480p"]',
  '[0.75,1,1.25,1.5,2]',
  1, 2
);

-- -------------------------------------------------------
-- Video 3 — Computer Vision with CNNs  (new)
-- -------------------------------------------------------
INSERT INTO videos
  (id, title, topic, description, duration, src, thumbnail, quality, playback_speeds, is_published, sort_order)
VALUES (
  3,
  'Computer Vision with CNNs',
  'Computer Vision',
  'Discover how Convolutional Neural Networks see images — from edge detection and feature maps to real-world object recognition.',
  '23:15',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800',
  '["1080p","720p","480p"]',
  '[0.75,1,1.25,1.5,2]',
  1, 3
);
