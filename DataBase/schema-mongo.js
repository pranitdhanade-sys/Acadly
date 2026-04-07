// DataBase/schema-mongo.js
// MongoDB schemas for Acadly video streaming system using GridFS

const mongoose = require("./resolve-mongoose");

// ============================================================
// VIDEO METADATA SCHEMA
// Stores metadata for videos stored in GridFS
// ============================================================
const videoMetadataSchema = new mongoose.Schema(
  {
    // Reference to GridFS file_id
    file_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      description: "GridFS file ID for the video binary",
    },

    // Video information
    title: {
      type: String,
      required: true,
      trim: true,
      description: "Video title",
    },

    description: {
      type: String,
      trim: true,
      description: "Video description/summary",
    },

    topic: {
      type: String,
      description: "Learning topic (e.g., 'Machine Learning')",
    },

    category: {
      type: String,
      default: "General",
      description: "Video category for filtering",
    },

    subcategory: {
      type: String,
      description: "Video subcategory",
    },

    // Media properties
    duration: {
      type: Number,
      required: true,
      description: "Video duration in seconds",
    },

    format: {
      type: String,
      enum: ["mp4", "webm", "mkv", "avi"],
      default: "mp4",
      description: "Video format/codec",
    },

    resolution: {
      type: [String],
      default: ["720p"],
      description: "Available resolutions: [1080p, 720p, 480p, 360p]",
    },

    bitrate: {
      type: String,
      description: "Video bitrate (e.g., '5 Mbps')",
    },

    fileSize: {
      type: Number,
      description: "File size in bytes",
    },

    mimeType: {
      type: String,
      default: "video/mp4",
      description: "MIME type for HTTP headers",
    },

    localFilePath: {
      type: String,
      description: "Absolute path of local backup in /Videos folder",
    },

    // Thumbnail
    thumbnail: {
      type: String,
      description: "Thumbnail URL (base64 or external link)",
    },

    // Optional WebVTT / track URLs for the HTML5 player
    subtitleTracks: [
      {
        kind: { type: String, default: "subtitles" },
        label: String,
        srclang: String,
        src: { type: String, required: true },
        default: { type: Boolean, default: false },
      },
    ],

    // Inline study notes (shown in player drawer)
    notes: {
      type: [String],
      default: [],
    },

    // Single end-of-video quiz (optional)
    quiz: {
      question: { type: String },
      options: [{ type: String }],
      correctIndex: { type: Number, min: 0 },
    },

    thumbnailGridFS: {
      type: mongoose.Schema.Types.ObjectId,
      description: "GridFS ID of thumbnail image (optional)",
    },

    // Educational metadata
    targetAudience: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },

    learningOutcomes: {
      type: [String],
      description: "List of learning objectives",
    },

    tags: {
      type: [String],
      description: "Search tags",
    },

    // Gamification
    xpReward: {
      type: Number,
      default: 25,
      description: "XP points awarded for completing this video",
    },

    // Status
    isPublished: {
      type: Boolean,
      default: false,
      description: "Video is published and visible to students",
    },

    isActive: {
      type: Boolean,
      default: true,
      description: "Video is available (not archived/disabled)",
    },

    // Audit
    uploadedBy: {
      type: Number,
      description: "MySQL user_id of uploader",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    views: {
      type: Number,
      default: 0,
      description: "Total view count",
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      description: "Average user rating",
    },
  },
  {
    collection: "video_metadata",
    timestamps: true,
  }
);

// Create indexes for faster queries
videoMetadataSchema.index({ title: "text", description: "text", tags: 1 });
videoMetadataSchema.index({ category: 1 });
videoMetadataSchema.index({ isPublished: 1, isActive: 1 });
videoMetadataSchema.index({ file_id: 1 });

const VideoMetadata = mongoose.model("VideoMetadata", videoMetadataSchema);

// ============================================================
// VIDEO FEEDBACK SCHEMA (Optional)
// Stores user ratings/reviews for videos
// ============================================================
const videoFeedbackSchema = new mongoose.Schema(
  {
    video_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoMetadata",
      required: true,
    },

    user_id: {
      type: Number,
      required: true,
      description: "MySQL user_id",
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
    },

    helpful: {
      type: Number,
      default: 0,
      description: "Count of users who found this feedback helpful",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "video_feedback",
  }
);

const VideoFeedback = mongoose.model("VideoFeedback", videoFeedbackSchema);

// ============================================================
// EXPORT SCHEMAS AND INITIALIZATION
// ============================================================

/**
 * Initialize MongoDB collections (run once)
 * Creates indexes and ensures collections exist
 */
async function initializeCollections() {
  try {
    // Create collections and indexes
    await VideoMetadata.collection.createIndex({ file_id: 1 });
    await VideoMetadata.collection.createIndex({
      title: "text",
      description: "text",
    });
    await VideoFeedback.collection.createIndex({
      video_id: 1,
      user_id: 1,
    });

    console.log("✅ MongoDB collections initialized");
    return true;
  } catch (error) {
    console.error("❌ Error initializing collections:", error.message);
    return false;
  }
}

module.exports = {
  VideoMetadata,
  VideoFeedback,
  initializeCollections,
};
