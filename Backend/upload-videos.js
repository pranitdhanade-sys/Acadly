#!/usr/bin/env node
/**
 * Upload local video files to MongoDB GridFS + video_metadata collection.
 *
 * Usage (from repo root):
 *   node Backend/upload-videos.js
 *
 * Prerequisites:
 *   - MongoDB running (e.g. mongod or Atlas URI in .env as MONGO_URI)
 *   - Videos in ./Videos (project root)
 */

const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { connectMongoDB, getGridFSBucket } = require("../DataBase/db_config_mongo");
const { VideoMetadata, initializeCollections } = require("../DataBase/schema-mongo");

const VIDEOS_FOLDER = path.join(__dirname, "../Videos");
const GRIDFS_BUCKET = "videos";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function inferFormat(filename) {
  const ext = path.extname(filename || "").toLowerCase().replace(".", "");
  if (["mp4", "webm", "mkv", "avi"].includes(ext)) return ext;
  return "mp4";
}

async function uploadVideoFile(videoPath, metadata = {}) {
  if (!fs.existsSync(videoPath)) {
    throw new Error(`File not found: ${videoPath}`);
  }

  const fileStats = fs.statSync(videoPath);
  const fileName = path.basename(videoPath);
  const fileSize = fileStats.size;

  console.log(`\n📤 Uploading: ${fileName}`);
  console.log(`   Size: ${formatFileSize(fileSize)}`);

  const bucket = getGridFSBucket(GRIDFS_BUCKET);
  const uploadStream = bucket.openUploadStream(fileName, {
    contentType: metadata.mimeType || "video/mp4",
  });

  await new Promise((resolve, reject) => {
    fs.createReadStream(videoPath)
      .pipe(uploadStream)
      .on("error", reject);
    uploadStream.on("error", reject);
    uploadStream.on("finish", resolve);
  });

  const doc = await VideoMetadata.create({
    file_id: uploadStream.id,
    title: metadata.title || fileName.replace(/\.[^.]+$/, ""),
    description: metadata.description || "",
    topic: metadata.topic || "",
    category: metadata.category || "General",
    subcategory: metadata.subcategory || "",
    duration: Number(metadata.duration) || 0,
    format: metadata.format || inferFormat(fileName),
    mimeType: metadata.mimeType || "video/mp4",
    fileSize,
    xpReward: Number(metadata.xpReward) || 25,
    tags: Array.isArray(metadata.tags) ? metadata.tags : [],
    isPublished: metadata.isPublished !== false,
    isActive: true,
    thumbnail: metadata.thumbnail || undefined,
    notes: Array.isArray(metadata.notes) ? metadata.notes : [],
    quiz:
      metadata.quiz &&
        metadata.quiz.question &&
        Array.isArray(metadata.quiz.options)
        ? {
          question: metadata.quiz.question,
          options: metadata.quiz.options,
          correctIndex: Number(metadata.quiz.correctIndex) || 0,
        }
        : undefined,
    subtitleTracks: Array.isArray(metadata.subtitleTracks) ? metadata.subtitleTracks : [],
    uploadedBy: metadata.uploadedBy,
  });

  console.log(`   ✅ Done — video _id: ${doc._id}`);
  console.log(`   Stream: /api/videos/${doc._id}/stream`);
  return doc;
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🎬 ACADLY — upload videos → MongoDB (GridFS)");
  console.log("=".repeat(70));

  await connectMongoDB();
  await initializeCollections();

  const videosToUpload = [
    {
      filePath: "OOPs.mp4",
      metadata: {
        title: "Object-Oriented Programming (OOPs)",
        description:
          "Complete guide to OOP concepts, classes, inheritance, and polymorphism",
        category: "Programming",
        subcategory: "Advanced",
        duration: 3600,
        xpReward: 50,
        tags: ["OOP", "Programming", "Java"],
        notes: [
          "Classes are blueprints that define the structure and behavior of objects.",
          "Inheritance allows a child class to inherit attributes and methods from a parent class.",
          "Polymorphism enables objects to take on multiple forms.",
          "Encapsulation hides internal object details.",
        ],
        quiz: {
          question: "Which of the following best describes object-oriented programming?",
          options: [
            "A programming paradigm centered around objects and classes.",
            "A method of storing all code in a single global scope.",
            "An approach that uses only functions without any data structures.",
            "A language-specific feature only available in Java.",
          ],
          correctIndex: 0,
        },
      },
    },
    {
      filePath: "बॅकप्रोपगेशन__AI_च्या_शिकण्याचे_इंजिन.mp4",
      metadata: {
        title: "Backpropagation - AI's Learning Engine",
        description:
          "Understanding backpropagation: gradients, chain rule, and weight updates.",
        topic: "Machine Learning",
        category: "Artificial Intelligence",
        subcategory: "Machine Learning",
        duration: 2400,
        xpReward: 45,
        tags: ["AI", "Machine Learning", "Neural Networks", "Backpropagation"],
        notes: [
          "Backpropagation computes gradients of the loss with respect to each weight.",
          "The chain rule lets gradients flow backward through layers.",
          "Weights are updated using the gradient and learning rate.",
        ],
        quiz: {
          question: "What is the purpose of backpropagation in neural networks?",
          options: [
            "To forward data through all layers without any updates.",
            "To calculate gradients and update weights to minimize the loss function.",
            "To add random noise to the model for regularization.",
            "To compress the model size for faster deployment.",
          ],
          correctIndex: 1,
        },
      },
    },
  ];

  if (!fs.existsSync(VIDEOS_FOLDER)) {
    fs.mkdirSync(VIDEOS_FOLDER, { recursive: true });
    console.log(`\n📁 Created folder: ${VIDEOS_FOLDER}`);
    console.log("   Add .mp4 files there and edit videosToUpload in upload-videos.js if needed.\n");
  }

  const uploaded = [];
  for (let i = 0; i < videosToUpload.length; i++) {
    const item = videosToUpload[i];
    const fullPath = path.join(VIDEOS_FOLDER, item.filePath);
    console.log(`\n[${i + 1}/${videosToUpload.length}] ${item.metadata.title}`);
    try {
      if (!fs.existsSync(fullPath)) {
        console.log(`   ⚠️  Skipped — not found: ${fullPath}`);
        continue;
      }
      uploaded.push(await uploadVideoFile(fullPath, item.metadata));
    } catch (e) {
      console.log(`   ❌ ${e.message}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Finished — ${uploaded.length} video(s) in MongoDB`);
  console.log("=".repeat(70) + "\n");

  const mongoose = require("../DataBase/resolve-mongoose");
  await mongoose.disconnect();
}

if (require.main === module) {
  main().catch((e) => {
    console.error("\n❌", e.message);
    process.exit(1);
  });
}

module.exports = { uploadVideoFile };
