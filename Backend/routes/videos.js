// Backend/routes/videos.js
// REFACTORED - Video management with MongoDB GridFS streaming + MySQL metadata
// Streams videos from MongoDB GridFS while maintaining metadata in MySQL

const express = require("express");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const db = require("../db_config");
const { getGridFSBucket } = require("../../DataBase/db_config_mongo");

// Import VideoMetadata schema
const VideoMetadataSchema = new mongoose.Schema({
  file_id: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  category: String,
  subcategory: String,
  duration: Number,
  format: String,
  mimeType: String,
  fileSize: Number,
  uploadedBy: mongoose.Schema.Types.ObjectId,
  isPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  xpReward: { type: Number, default: 25 },
  tags: [String],
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const VideoMetadata = mongoose.model("VideoMetadata", VideoMetadataSchema);

const router = express.Router();

// Configure multer for file uploads (stored in memory before GridFS transfer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["video/mp4", "video/webm", "video/quicktime"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only MP4, WebM, and MOV files allowed"));
    }
  },
});

// ============================================
// HELPER: Verify JWT Token Middleware
// ============================================
async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    req.user_id = decoded.user_id;
    req.user_role = decoded.role;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
}

// ============================================
// 1. GET ALL VIDEOS (Metadata Only)
// ============================================
router.get("/", async (req, res) => {
  try {
    const videos = await VideoMetadata.find({ isPublished: true, isActive: true })
      .select("title description category subcategory duration thumbnail xpReward rating views")
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// ============================================
// 2. GET SINGLE VIDEO METADATA
// ============================================
router.get("/:video_id/metadata", async (req, res) => {
  try {
    const { video_id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(video_id)) {
      return res.status(400).json({ error: "Invalid video ID format" });
    }

    const video = await VideoMetadata.findById(video_id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    if (!video.isPublished || !video.isActive) {
      return res.status(403).json({ error: "Video is not available" });
    }

    // Increment view count
    video.views = (video.views || 0) + 1;
    await video.save();

    res.status(200).json(video);
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    res.status(500).json({ error: "Failed to fetch video metadata" });
  }
});

// ============================================
// 3. STREAM VIDEO FILE FROM MONGODB GRIDFS
// ============================================
router.get("/:video_id/stream", async (req, res) => {
  try {
    const { video_id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(video_id)) {
      return res.status(400).json({ error: "Invalid video ID format" });
    }

    // Get video metadata
    const videoData = await VideoMetadata.findById(video_id);

    if (!videoData || !videoData.isPublished || !videoData.isActive) {
      return res.status(404).json({ error: "Video not found or unavailable" });
    }

    // Get GridFS file
    const bucket = getGridFSBucket("videos");
    const file = await bucket.find({ _id: videoData.file_id }).toArray();

    if (file.length === 0) {
      return res.status(404).json({ error: "Video file not found in storage" });
    }

    const fileInfo = file[0];
    const fileSize = fileInfo.length;

    // Set response headers for streaming
    res.set({
      "Content-Type": videoData.mimeType || "video/mp4",
      "Content-Length": fileSize,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    });

    // Handle range requests (for seeking in video)
    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      const [startStr, endStr] = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      res.status(206).set({
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Content-Length": end - start + 1,
      });

      const downloadStream = bucket.openDownloadStream(videoData.file_id, {
        start,
        end: end + 1,
      });

      downloadStream.pipe(res);
      downloadStream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream video" });
        }
      });
    } else {
      // Full file stream
      const downloadStream = bucket.openDownloadStream(videoData.file_id);

      downloadStream.pipe(res);
      downloadStream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to stream video" });
        }
      });
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream video" });
    }
  }
});

// ============================================
// 4. UPLOAD NEW VIDEO TO MONGODB GRIDFS (Admin/Teacher)
// ============================================
router.post("/upload", verifyToken, upload.single("videoFile"), async (req, res) => {
  try {
    // Authorization check
    if (req.user_role !== "admin" && req.user_role !== "teacher") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Validate file uploaded
    if (!req.file) {
      return res.status(400).json({ error: "Video file required" });
    }

    // Validate required metadata
    const { title, description, category, duration } = req.body;

    if (!title || !category || !duration) {
      return res.status(400).json({
        error: "Title, category, and duration are required",
      });
    }

    // Upload to GridFS
    const bucket = getGridFSBucket("videos");
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    // Upload file buffer to GridFS
    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", async () => {
      try {
        // Create metadata document
        const videoMetadata = new VideoMetadata({
          file_id: uploadStream.id,
          title: title.trim(),
          description: description?.trim() || "",
          category: category.trim(),
          subcategory: req.body.subcategory?.trim() || "General",
          duration: parseInt(duration),
          format: req.file.mimetype.split("/")[1] || "mp4",
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: req.user_id,
          isPublished: req.body.isPublished === "true" || false,
          isActive: true,
          xpReward: parseInt(req.body.xpReward) || 25,
          tags: req.body.tags ? req.body.tags.split(",").map((t) => t.trim()) : [],
          targetAudience: req.body.targetAudience || "intermediate",
        });

        const savedMetadata = await videoMetadata.save();

        res.status(201).json({
          message: "Video uploaded successfully",
          video_id: savedMetadata._id,
          file_id: uploadStream.id,
        });
      } catch (error) {
        console.error("Error saving video metadata:", error);
        res.status(500).json({ error: "Failed to save video metadata" });
      }
    });

    uploadStream.on("error", (error) => {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload video" });
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({ error: "Failed to process upload" });
  }
});

// ============================================
// 5. UPDATE VIDEO METADATA (Admin/Teacher)
// ============================================
router.put("/:video_id/metadata", verifyToken, async (req, res) => {
  try {
    if (req.user_role !== "admin" && req.user_role !== "teacher") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.video_id)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const { title, description, category, isPublished, xpReward } = req.body;

    const update = {};
    if (title) update.title = title;
    if (description) update.description = description;
    if (category) update.category = category;
    if (isPublished !== undefined) update.isPublished = isPublished;
    if (xpReward) update.xpReward = xpReward;

    const video = await VideoMetadata.findByIdAndUpdate(
      req.params.video_id,
      update,
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.status(200).json({ message: "Video updated", video });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
});

// ============================================
// 6. DELETE VIDEO (Admin Only)
// ============================================
router.delete("/:video_id", verifyToken, async (req, res) => {
  try {
    if (req.user_role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.video_id)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const video = await VideoMetadata.findById(req.params.video_id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Delete from GridFS
    const bucket = getGridFSBucket("videos");
    await bucket.delete(video.file_id);

    // Delete metadata
    await VideoMetadata.findByIdAndDelete(req.params.video_id);

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

// ============================================
// 7. SEARCH VIDEOS
// ============================================
router.get("/search/:query", async (req, res) => {
  try {
    const { query } = req.params;

    const videos = await VideoMetadata.find(
      {
        $text: { $search: query },
        isPublished: true,
        isActive: true,
      },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .select("title description category duration thumbnail rating views");

    res.status(200).json(videos);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// ============================================
// 8. TRACK VIDEO PROGRESS (MySQL)
// ============================================
router.post("/:video_id/progress", verifyToken, async (req, res) => {
  try {
    const { video_id } = req.params;
    const { watch_seconds, completed, quiz_score } = req.body;
    const user_id = req.user_id;

    if (!db) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    // Insert or update progress in MySQL
    await db.query(
      `INSERT INTO user_video_progress (user_id, video_id, watch_seconds, completed, quiz_score)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         watch_seconds = ?, completed = ?, quiz_score = ?, last_watched = NOW()`,
      [
        user_id,
        video_id,
        watch_seconds || 0,
        completed || 0,
        quiz_score || 0,
        watch_seconds || 0,
        completed || 0,
        quiz_score || 0,
      ]
    );

    // Award XP if completed
    if (completed) {
      const XP_REWARD = 25;
      await db.query(
        `UPDATE user_profiles SET xp_total = xp_total + ? WHERE user_id = ?`,
        [XP_REWARD, user_id]
      );

      await db.query(
        `UPDATE user_video_progress SET xp_awarded = ? WHERE user_id = ? AND video_id = ?`,
        [XP_REWARD, user_id, video_id]
      );
    }

    res.status(200).json({ message: "Progress tracked" });
  } catch (error) {
    console.error("Progress tracking error:", error);
    res.status(500).json({ error: "Failed to track progress" });
  }
});

// ============================================
// 9. GET USER'S VIDEO PROGRESS (MySQL)
// ============================================
router.get("/:video_id/user-progress", verifyToken, async (req, res) => {
  try {
    const { video_id } = req.params;
    const user_id = req.user_id;

    if (!db) {
      return res.status(503).json({ error: "Database unavailable" });
    }

    const [progress] = await db.query(
      `SELECT watch_seconds, completed, quiz_score, xp_awarded, last_watched
       FROM user_video_progress
       WHERE user_id = ? AND video_id = ?`,
      [user_id, video_id]
    );

    res.status(200).json(
      progress[0] || {
        watch_seconds: 0,
        completed: 0,
        quiz_score: 0,
        xp_awarded: 0,
      }
    );
  } catch (error) {
    console.error("Get progress error:", error);
    res.status(500).json({ error: "Failed to get progress" });
  }
});

module.exports = router;
