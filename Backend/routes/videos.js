// Backend/routes/videos.js
// Video metadata in MongoDB; binaries in GridFS (bucket "videos").

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const { connectMongoDB, getGridFSBucket } = require("../../DataBase/db_config_mongo");
const { VideoMetadata } = require("../../DataBase/schema-mongo");

const router = express.Router();
const GRIDFS_BUCKET = "videos";
const LOCAL_VIDEOS_DIR = path.join(__dirname, "../../Videos");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(LOCAL_VIDEOS_DIR, { recursive: true });
      cb(null, LOCAL_VIDEOS_DIR);
    },
    filename: (req, file, cb) => {
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .slice(0, 80);
      const ext = path.extname(file.originalname) || ".mp4";
      cb(null, `${Date.now()}-${safeBase || "video"}${ext}`);
    },
  }),
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1 GB
  fileFilter: (req, file, cb) => {
    if (String(file.mimetype || "").startsWith("video/")) return cb(null, true);
    cb(new Error("Only video files are allowed"));
  },
});

function runSingleUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single("video")(req, res, (err) => {
      if (!err) return resolve();
      reject(err);
    });
  });
}

function isObjectIdString(id) {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

async function ensureMongo() {
  if (mongoose.connection.readyState !== 1) {
    await connectMongoDB();
  }
}

function inferFormat(filename) {
  const ext = path.extname(filename || "").toLowerCase().replace(".", "");
  if (["mp4", "webm", "mkv", "avi"].includes(ext)) return ext;
  return "mp4";
}

function toPlaylistItem(doc) {
  const plain = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const id = String(plain._id);
  const durSec = Number(plain.duration) || 0;
  const mm = Math.floor(durSec / 60);
  const ss = durSec % 60;
  return {
    id,
    title: plain.title,
    topic: plain.topic || plain.category || "General",
    duration: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
    durationSeconds: durSec,
    quality:
      Array.isArray(plain.resolution) && plain.resolution.length
        ? plain.resolution
        : ["1080p", "720p", "480p"],
    playbackSpeeds: [0.75, 1, 1.25, 1.5, 2],
    src: `/api/videos/${id}/stream`,
    thumbnail: plain.thumbnail || null,
    tracks: plain.subtitleTracks || [],
    description: plain.description || "",
    xpReward: plain.xpReward ?? 25,
    notes: plain.notes || [],
    quiz: plain.quiz || null,
    category: plain.category || "General",
  };
}

// ============================================
// GET /api/videos — published videos for the player
// ============================================
router.get("/", async (req, res) => {
  try {
    await ensureMongo();
    const list = await VideoMetadata.find({ isPublished: true, isActive: true })
      .sort({ uploadedAt: -1 })
      .exec();
    res.json(list.map(toPlaylistItem));
  } catch (err) {
    console.error("GET /api/videos:", err.message);
    res.status(503).json({
      error: "Video service unavailable",
      detail: err.message,
    });
  }
});

// ============================================
// POST /api/videos/upload — multipart field "video"
// Optional JSON strings: notes, quiz
// ============================================
router.post("/upload", async (req, res) => {
  try {
    await runSingleUpload(req, res);
    await ensureMongo();
    if (!req.file) {
      return res.status(400).json({ error: "Missing file (use field name: video)" });
    }
    if (!String(req.file.mimetype || "").startsWith("video/")) {
      return res.status(400).json({ error: "Unsupported file type. Please upload a video file." });
    }

    const bucket = getGridFSBucket(GRIDFS_BUCKET);
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype || "video/mp4",
    });

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(uploadStream)
        .on("error", reject);
      uploadStream.on("error", reject);
      uploadStream.on("finish", resolve);
    });

    let notes = [];
    let quiz;
    try {
      if (req.body.notes) notes = JSON.parse(req.body.notes);
      if (!Array.isArray(notes)) notes = [];
    } catch (_) {
      notes = [];
    }
    try {
      if (req.body.quiz) quiz = JSON.parse(req.body.quiz);
    } catch (_) {
      quiz = undefined;
    }

    let subtitleTracks = [];
    try {
      if (req.body.subtitleTracks) subtitleTracks = JSON.parse(req.body.subtitleTracks);
      if (!Array.isArray(subtitleTracks)) subtitleTracks = [];
    } catch (_) {
      subtitleTracks = [];
    }

    const doc = await VideoMetadata.create({
      file_id: uploadStream.id,
      title: req.body.title || path.parse(req.file.originalname).name,
      description: req.body.description || "",
      topic: req.body.topic || "",
      category: req.body.category || "General",
      subcategory: req.body.subcategory || "",
      duration: Number(req.body.duration) || 0,
      format: inferFormat(req.file.originalname),
      mimeType: req.file.mimetype || "video/mp4",
      fileSize: req.file.size,
      xpReward: Number(req.body.xpReward) || 25,
      tags: req.body.tags
        ? String(req.body.tags)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      isPublished: req.body.isPublished !== "false" && req.body.isPublished !== false,
      isActive: true,
      thumbnail: req.body.thumbnail || undefined,
      notes,
      quiz,
      subtitleTracks,
      localFilePath: req.file.path,
    });

    res.status(201).json(toPlaylistItem(doc));
  } catch (err) {
    console.error("POST /api/videos/upload:", err.message);
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Upload failed", detail: "File exceeds 1GB limit." });
    }
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

// ============================================
// GET /api/videos/upload/recent — latest uploads for admin UI
// ============================================
router.get("/upload/recent", async (req, res) => {
  try {
    await ensureMongo();
    const docs = await VideoMetadata.find({})
      .sort({ uploadedAt: -1 })
      .limit(12)
      .lean()
      .exec();
    res.json(
      docs.map((d) => ({
        id: String(d._id),
        title: d.title,
        category: d.category || "General",
        uploadedAt: d.uploadedAt,
        isPublished: !!d.isPublished,
        localFilePath: d.localFilePath || null,
      }))
    );
  } catch (err) {
    console.error("GET /api/videos/upload/recent:", err.message);
    res.status(500).json({ error: "Could not fetch recent uploads" });
  }
});

// ============================================
// GET /api/videos/:id/stream — GridFS with Range support
// ============================================
router.get("/:id/stream", async (req, res) => {
  try {
    await ensureMongo();
    const { id } = req.params;
    if (!isObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid video id" });
    }

    const video = await VideoMetadata.findById(id).lean();
    if (!video || !video.isPublished || !video.isActive) {
      return res.status(404).json({ error: "Video not found" });
    }
    if (!video.file_id) {
      return res.status(404).json({ error: "No media file" });
    }

    const bucket = getGridFSBucket(GRIDFS_BUCKET);
    const fileObjectId = new mongoose.Types.ObjectId(video.file_id);
    const filesColl = mongoose.connection.db.collection(`${GRIDFS_BUCKET}.files`);
    const fileDoc = await filesColl.findOne({ _id: fileObjectId });
    if (!fileDoc) {
      return res.status(404).json({ error: "File missing in storage" });
    }

    const fileSize = fileDoc.length;
    const contentType = video.mimeType || fileDoc.contentType || "video/mp4";
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (Number.isNaN(start) || start < 0 || start >= fileSize) {
        res.status(416);
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }
      if (Number.isNaN(end) || end >= fileSize) end = fileSize - 1;
      if (end < start) {
        res.status(416);
        res.setHeader("Content-Range", `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
      res.setHeader("Accept-Ranges", "bytes");
      res.setHeader("Content-Length", String(chunkSize));
      res.setHeader("Content-Type", contentType);

      const downloadStream = bucket.openDownloadStream(fileObjectId, {
        start,
        end: end + 1,
      });
      downloadStream.on("error", (e) => {
        console.error("GridFS range stream:", e.message);
        if (!res.headersSent) res.status(500).end();
        else res.destroy(e);
      });
      downloadStream.pipe(res);
    } else {
      res.setHeader("Content-Length", String(fileSize));
      res.setHeader("Content-Type", contentType);
      res.setHeader("Accept-Ranges", "bytes");
      const downloadStream = bucket.openDownloadStream(fileObjectId);
      downloadStream.on("error", (e) => {
        console.error("GridFS stream:", e.message);
        if (!res.headersSent) res.status(500).end();
        else res.destroy(e);
      });
      downloadStream.pipe(res);
    }
  } catch (err) {
    console.error("GET /api/videos/:id/stream:", err.message);
    if (!res.headersSent) res.status(500).json({ error: "Stream failed" });
  }
});

// ============================================
// GET /api/videos/:id — single item (playlist shape)
// ============================================
router.get("/:id", async (req, res) => {
  try {
    await ensureMongo();
    const { id } = req.params;
    if (!isObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid video id" });
    }
    const doc = await VideoMetadata.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(toPlaylistItem(doc));
  } catch (err) {
    console.error("GET /api/videos/:id:", err.message);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// ============================================
// DELETE /api/videos/:id — metadata + GridFS file
// ============================================
router.delete("/:id", async (req, res) => {
  try {
    await ensureMongo();
    const { id } = req.params;
    if (!isObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid video id" });
    }
    const doc = await VideoMetadata.findById(id).exec();
    if (!doc) {
      return res.status(404).json({ error: "Video not found" });
    }

    const bucket = getGridFSBucket(GRIDFS_BUCKET);
    try {
      await bucket.delete(new mongoose.Types.ObjectId(doc.file_id));
    } catch (e) {
      console.warn("GridFS delete (may already be gone):", e.message);
    }

    await VideoMetadata.findByIdAndDelete(id);
    res.json({ ok: true, message: "Video removed" });
  } catch (err) {
    console.error("DELETE /api/videos/:id:", err.message);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

module.exports = router;
