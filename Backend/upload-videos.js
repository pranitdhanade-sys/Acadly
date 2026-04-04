#!/usr/bin/env node
/**
 * Acadly Video Uploader
 * Uploads videos from local folder to MongoDB GridFS
 * 
 * Usage:
 *   node upload-videos.js
 * 
 * Before running:
 * 1. Ensure MongoDB is running: mongod or docker run -d -p 27017:27017 mongo
 * 2. Place your videos in ../Videos/ folder
 * 3. Update videosToUpload array below with your video files
 */

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ============================================
// Configuration
// ============================================
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/acadly_videos";
const VIDEOS_FOLDER = path.join(__dirname, "../Videos");

// ============================================
// MongoDB VideoMetadata Schema
// ============================================
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
  isPublished: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  xpReward: { type: Number, default: 25 },
  tags: [String],
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const VideoMetadata = mongoose.model("VideoMetadata", VideoMetadataSchema);

// ============================================
// Helper: Get GridFS Bucket
// ============================================
function getGridFSBucket() {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "videos",
  });
  return bucket;
}

// ============================================
// Helper: Format File Size
// ============================================
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// ============================================
// Main: Upload Video
// ============================================
async function uploadVideo(videoPath, metadata) {
  try {
    // Verify file exists
    if (!fs.existsSync(videoPath)) {
      throw new Error(`File not found: ${videoPath}`);
    }

    const fileStats = fs.statSync(videoPath);
    const fileName = path.basename(videoPath);
    const fileSize = fileStats.size;

    console.log(`\n📤 Uploading: ${fileName}`);
    console.log(`   Size: ${formatFileSize(fileSize)}`);

    // Upload to GridFS
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: "video/mp4",
    });

    // Pipe file to GridFS
    const readStream = fs.createReadStream(videoPath);
    readStream.pipe(uploadStream);

    return new Promise((resolve, reject) => {
      uploadStream.on("finish", async () => {
        try {
          // Create metadata document
          const videoDoc = new VideoMetadata({
            file_id: uploadStream.id,
            title: metadata.title || fileName.replace(".mp4", ""),
            description: metadata.description || "Uploaded video",
            category: metadata.category || "General",
            subcategory: metadata.subcategory || "Uncategorized",
            duration: metadata.duration || 0,
            format: "mp4",
            mimeType: "video/mp4",
            fileSize: fileSize,
            uploadedBy: metadata.uploadedBy || null,
            isPublished: metadata.isPublished !== false,
            isActive: true,
            xpReward: metadata.xpReward || 25,
            tags: metadata.tags || [],
          });

          const saved = await videoDoc.save();

          console.log(`   ✅ Uploaded successfully`);
          console.log(`   Video ID: ${saved._id}`);
          console.log(`   File ID: ${uploadStream.id}`);
          console.log(`   Stream URL: http://localhost:3000/api/videos/${saved._id}/stream`);

          resolve(saved);
        } catch (error) {
          reject(error);
        }
      });

      uploadStream.on("error", reject);
      readStream.on("error", reject);
    });
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

// ============================================
// Main: Upload All Videos
// ============================================
async function main() {
  try {
    console.log("\n" + "=".repeat(70));
    console.log("🎬 ACADLY VIDEO UPLOADER");
    console.log("=".repeat(70));

    // Connect to MongoDB
    console.log(`\n🔗 Connecting to MongoDB: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // ============================================
    // ⚙️  CONFIGURE YOUR VIDEOS HERE
    // ============================================
    const videosToUpload = [
      {
        filePath: "OOPs.mp4",
        metadata: {
          title: "Object-Oriented Programming (OOPs)",
          description: "Complete guide to OOP concepts, classes, inheritance, and polymorphism",
          category: "Programming",
          subcategory: "Advanced",
          duration: 3600, // 60 minutes
          xpReward: 50,
          tags: ["OOP", "Programming", "Java"],
          isPublished: true,
        },
      },
      // Add more videos below:
      // {
      //   filePath: "DataStructures.mp4",
      //   metadata: {
      //     title: "Data Structures Fundamentals",
      //     description: "Learn arrays, linked lists, trees, and graphs",
      //     category: "Programming",
      //     duration: 2400,
      //     xpReward: 35,
      //   },
      // },
      // {
      //   filePath: "Algorithms.mp4",
      //   metadata: {
      //     title: "Algorithm Design & Analysis",
      //     description: "Sorting, searching, and complexity analysis",
      //     category: "Programming",
      //     duration: 2000,
      //     xpReward: 30,
      //   },
      // },
    ];

    console.log(`📋 Ready to upload: ${videosToUpload.length} video(s)\n`);

    // Check if videos folder exists
    if (!fs.existsSync(VIDEOS_FOLDER)) {
      console.log(`⚠️  Videos folder not found: ${VIDEOS_FOLDER}`);
      console.log(`📁 Creating videos folder...`);
      fs.mkdirSync(VIDEOS_FOLDER, { recursive: true });
    }

    // Upload each video
    const uploadedVideos = [];
    for (let i = 0; i < videosToUpload.length; i++) {
      const video = videosToUpload[i];
      const fullPath = path.join(VIDEOS_FOLDER, video.filePath);

      console.log(`\n[${i + 1}/${videosToUpload.length}] ${video.metadata.title}`);

      try {
        if (!fs.existsSync(fullPath)) {
          console.log(`   ⚠️  Skipped: File not found at ${fullPath}`);
          console.log(`   Place your video file there and try again`);
          continue;
        }

        const result = await uploadVideo(fullPath, video.metadata);
        uploadedVideos.push(result);
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }

    // Summary
    console.log("\n" + "=".repeat(70));
    console.log(`✅ Upload Complete! ${uploadedVideos.length}/${videosToUpload.length} video(s) uploaded`);
    console.log("=".repeat(70) + "\n");

    // Print video IDs for frontend
    if (uploadedVideos.length > 0) {
      console.log("🎯 Next Steps:");
      console.log("1. Copy the Video IDs below");
      console.log("2. Update Frontend/js/video-metadata.js with these IDs\n");

      console.log("📺 Uploaded Videos:\n");
      uploadedVideos.forEach((v, i) => {
        console.log(`${i + 1}. ${v.title}`);
        console.log(`   Video ID:   ${v._id}`);
        console.log(`   Stream URL: http://localhost:3000/api/videos/${v._id}/stream\n`);
      });

      console.log("💡 Frontend Configuration Example:");
      console.log("```javascript");
      console.log("// Frontend/js/video-metadata.js");
      console.log("window.acadlyVideos = [");
      uploadedVideos.forEach((v) => {
        console.log(`  {`);
        console.log(`    id: "${v._id}",`);
        console.log(`    title: "${v.title}",`);
        console.log(`    src: "/api/videos/${v._id}/stream",`);
        console.log(`    duration: "${v.duration}",`);
        console.log(`    category: "${v.category}",`);
        console.log(`  },`);
      });
      console.log("];");
      console.log("```\n");
    }

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected\n");
  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = { uploadVideo };
