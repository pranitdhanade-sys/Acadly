-- ============================================================
-- Demo student "Fletcher" — matches dashboard_v2.html defaults.
-- Re-run safe: clears Fletcher's dashboard rows then re-inserts.
-- Requires schema.sql applied first.
-- ============================================================

USE acadly_db;

INSERT INTO users (email, password, name, role, is_active, date_of_birth, education_level)
VALUES (
  'fletcher@acadly.com',
  '$2a$10$placeholderUseRealBcryptInProduction',
  'Fletcher Reed',
  'student',
  1,
  '2003-10-12',
  'Undergraduate'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  date_of_birth = VALUES(date_of_birth),
  education_level = VALUES(education_level),
  role = 'student',
  is_active = 1;

SET @uid := (SELECT id FROM users WHERE email = 'fletcher@acadly.com' LIMIT 1);

INSERT INTO user_profiles (user_id, bio, xp_total, streak_days, level, gpa, department, badges_earned)
VALUES (@uid, 'Full-stack learner · hackathon builder', 1840, 15, 12, 3.65, 'Computer Science', CAST('["JS Master","AI Beginner"]' AS JSON))
ON DUPLICATE KEY UPDATE
  bio = VALUES(bio),
  xp_total = VALUES(xp_total),
  streak_days = VALUES(streak_days),
  level = VALUES(level),
  gpa = VALUES(gpa),
  department = VALUES(department),
  badges_earned = VALUES(badges_earned);

INSERT INTO user_progress (user_id, total_videos_watched, total_watch_time_minutes, average_video_completion_percentage, quiz_pass_rate, average_quiz_score, streak_current, streak_longest, certificates_earned)
VALUES (@uid, 24, 2550, 72.00, 88.50, 82.00, 15, 22, 3)
ON DUPLICATE KEY UPDATE
  total_videos_watched = VALUES(total_videos_watched),
  total_watch_time_minutes = VALUES(total_watch_time_minutes),
  average_video_completion_percentage = VALUES(average_video_completion_percentage),
  quiz_pass_rate = VALUES(quiz_pass_rate),
  average_quiz_score = VALUES(average_quiz_score),
  streak_current = VALUES(streak_current),
  streak_longest = VALUES(streak_longest),
  certificates_earned = VALUES(certificates_earned);

DELETE FROM user_dashboard_kpi WHERE user_id = @uid;
INSERT INTO user_dashboard_kpi (
  user_id, active_courses, courses_delta_note, course_coverage_pct,
  certificates_count, cert_subnote, latest_cert_name,
  learning_hours, hours_week_note, peak_study_day,
  peer_connections, peer_delta_note, peer_footer_note,
  modules_header_count, streak_days
) VALUES (
  @uid, 8, '+2 this month', 72,
  3, 'Verifiable IDs', 'Frontend Foundations',
  42.5, 'Last 7 days: 12.3h', 'Sunday',
  27, '+5 new', '2 study groups active',
  6, 15
);

DELETE FROM user_study_modules WHERE user_id = @uid;
INSERT INTO user_study_modules (user_id, title, subtitle, progress_pct, sort_order) VALUES
(@uid, 'Advanced JavaScript', 'Async patterns + performance', 65, 1),
(@uid, 'Neon UI Fundamentals', 'Design systems + motion', 100, 2),
(@uid, 'Motion & Scroll Reveals', 'Micro-interactions', 38, 3);

DELETE FROM user_certificate_rows WHERE user_id = @uid;
INSERT INTO user_certificate_rows (user_id, kind, title, subtitle_line, verifiable_id, issued_date, sort_order) VALUES
(@uid, 'hero', 'Frontend Foundations', 'Certificate', 'acadly_12345', '2026-03-12', 1),
(@uid, 'secondary', 'JavaScript Specialist', 'Verified', 'acadly_88420', '2026-02-01', 2);

DELETE FROM user_badge_quest WHERE user_id = @uid;
INSERT INTO user_badge_quest (user_id, title, description, progress_current, progress_total) VALUES
(@uid, 'Neon Night Owl', 'Complete 3 late-night sessions this week.', 2, 3);

DELETE FROM user_badge_gallery WHERE user_id = @uid;
INSERT INTO user_badge_gallery (user_id, name, subtitle, status, icon_hint, sort_order) VALUES
(@uid, 'Neon Night Owl', 'Weekly drop', 'in_progress', 'moon', 1),
(@uid, 'Flow State', '2h focus session', 'earned', 'bolt', 2),
(@uid, 'Peer Spark', 'Help 5 peers', 'locked', 'heart', 3),
(@uid, 'Streak Crown', '30-day streak', 'locked', 'crown', 4);

DELETE FROM user_gamification_tags WHERE user_id = @uid;
INSERT INTO user_gamification_tags (user_id, label, variant, sort_order) VALUES
(@uid, 'JS Master', 'brand', 1),
(@uid, 'AI Beginner', 'cyan', 2),
(@uid, 'Locked', 'muted', 3);

DELETE FROM dashboard_chart_hours WHERE user_id = @uid;
INSERT INTO dashboard_chart_hours (user_id, weekday, hours) VALUES
(@uid, 0, 1.2), (@uid, 1, 2.1), (@uid, 2, 2.6), (@uid, 3, 3.1),
(@uid, 4, 2.4), (@uid, 5, 3.6), (@uid, 6, 4.2);

DELETE FROM dashboard_chart_completion WHERE user_id = @uid;
INSERT INTO dashboard_chart_completion (user_id, completed_pct, in_progress_pct) VALUES (@uid, 72, 28);
