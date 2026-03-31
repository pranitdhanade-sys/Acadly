"use strict";

const express = require("express");
const path    = require("path");
const router  = express.Router();

// Shared MySQL pool (DataBase/db_config.js)
// Falls back gracefully if MySQL is not running.
let pool;
try {
  pool = require(path.join(__dirname, "../../DataBase/db_config"));
} catch {
  pool = null;
}

// ---------------------------------------------------------------
// Static fallback playlist (used when MySQL is offline / not set up)
// ---------------------------------------------------------------
const FALLBACK_VIDEOS = [
  {
    id: 1,
    title: "Intro to Machine Learning",
    topic: "AI Foundations",
    duration: "12:34",
    quality: ["1080p", "720p", "480p"],
    playbackSpeeds: [0.75, 1, 1.25, 1.5, 2],
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnail: "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800",
    tracks: [
      { kind: "subtitles", label: "English", srclang: "en",
        src: "https://gist.githubusercontent.com/benkules/0e9eafbd6f66a8d89f5cb9184160a95c/raw/sample-en.vtt",
        default: true },
    ],
  },
  {
    id: 2,
    title: "Neural Networks Explained",
    topic: "Deep Learning",
    duration: "18:45",
    quality: ["1080p", "720p", "480p"],
    playbackSpeeds: [0.75, 1, 1.25, 1.5, 2],
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    thumbnail: "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg?auto=compress&cs=tinysrgb&w=800",
    tracks: [],
  },
  {
    id: 3,
    title: "Computer Vision with CNNs",
    topic: "Computer Vision",
    duration: "23:15",
    quality: ["1080p", "720p", "480p"],
    playbackSpeeds: [0.75, 1, 1.25, 1.5, 2],
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnail: "https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg?auto=compress&cs=tinysrgb&w=800",
    tracks: [],
  },
];

// ---------------------------------------------------------------
// Helper — parse JSON columns returned by MySQL
// ---------------------------------------------------------------
function safeJson(value, fallback) {
  if (Array.isArray(value)) return value;
  try   { return JSON.parse(value); }
  catch { return fallback; }
}

// ---------------------------------------------------------------
// GET /api/videos  — serves the video playlist to the player
// ---------------------------------------------------------------
router.get("/", async (req, res) => {
  // Try MySQL first
  if (pool) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM videos WHERE is_published = 1 ORDER BY sort_order, id`
      );

      if (rows.length > 0) {
        // Attach subtitle tracks to each video
        for (const v of rows) {
          const [tracks] = await pool.query(
            "SELECT * FROM video_tracks WHERE video_id = ?",
            [v.id]
          );
          v.tracks           = tracks.map((t) => ({
            kind    : t.kind,
            label   : t.label,
            srclang : t.srclang,
            src     : t.src,
            default : Boolean(t.is_default),
          }));
          v.quality          = safeJson(v.quality, []);
          v.playbackSpeeds   = safeJson(v.playback_speeds, [1]);
        }

        return res.json({ videos: rows, source: "database" });
      }
    } catch (err) {
      console.warn("videos route — MySQL query failed, using fallback:", err.message);
    }
  }

  // MySQL unavailable or no rows — return static fallback
  return res.json({ videos: FALLBACK_VIDEOS, source: "fallback" });
});

module.exports = router;
