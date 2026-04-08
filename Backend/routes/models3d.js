"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { connectMongoDB, mongoose } = require("../../DataBase/db_config_mongo");

const router = express.Router();

const MODELS_DIRECTORY = path.join(__dirname, "../../Frontend/3d-models");
const ALLOWED_EXTENSIONS = new Set([".glb", ".gltf", ".obj", ".stl", ".fbx"]);

const model3DSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    fileName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true, trim: true },
    format: { type: String, required: true, trim: true },
    fileSize: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
    uploadedAt: { type: Date, default: Date.now },
  },
  {
    collection: "model_3d_metadata",
    timestamps: true,
  }
);

model3DSchema.index({ title: "text", description: "text" });
model3DSchema.index({ tags: 1 });
model3DSchema.index({ uploadedAt: -1 });

const Model3D = mongoose.models.Model3D || mongoose.model("Model3D", model3DSchema);

let indexesEnsured = false;

async function ensureModelIndexes() {
  if (indexesEnsured) return;

  const existingIndexes = await Model3D.collection.indexes();
  const invalidTextIndexes = existingIndexes.filter((indexDef) => {
    const key = indexDef?.key || {};
    const weights = indexDef?.weights || {};
    const isTextIndex = key._fts === "text";
    const referencesTags =
      Object.prototype.hasOwnProperty.call(key, "tags") ||
      Object.prototype.hasOwnProperty.call(weights, "tags") ||
      String(indexDef?.name || "").toLowerCase().includes("tags");

    return isTextIndex && referencesTags;
  });

  for (const invalidIndex of invalidTextIndexes) {
    if (invalidIndex?.name) {
      await Model3D.collection.dropIndex(invalidIndex.name);
    }
  }

  await Model3D.syncIndexes();
  indexesEnsured = true;
}

function safeFileName(fileName = "") {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
  return `${Date.now()}-${baseName || "model"}${extension}`;
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(MODELS_DIRECTORY, { recursive: true });
      cb(null, MODELS_DIRECTORY);
    },
    filename: (req, file, cb) => {
      cb(null, safeFileName(file.originalname));
    },
  }),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (ALLOWED_EXTENSIONS.has(extension)) {
      return cb(null, true);
    }

    cb(new Error("Only .glb, .gltf, .obj, .stl, and .fbx files are supported"));
  },
});

function formatModelResponse(doc) {
  const model = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

  return {
    id: String(model._id),
    title: model.title,
    description: model.description || "",
    path: model.filePath,
    fileName: model.fileName,
    format: model.format,
    fileSize: model.fileSize || 0,
    tags: model.tags || [],
    uploadedAt: model.uploadedAt,
    downloadUrl: model.filePath,
  };
}

router.get("/", async (req, res) => {
  try {
    await connectMongoDB();
    await ensureModelIndexes();

    const models = await Model3D.find({})
      .sort({ uploadedAt: -1 })
      .lean();

    res.json(models.map(formatModelResponse));
  } catch (error) {
    res.status(500).json({
      error: "Failed to load 3D models",
      detail: error.message,
    });
  }
});

router.post("/upload", (req, res) => {
  upload.single("model")(req, res, async (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Model file exceeds 500MB limit" });
      }
      return res.status(400).json({ error: error.message });
    }

    try {
      await connectMongoDB();
      await ensureModelIndexes();

      if (!req.file) {
        return res.status(400).json({ error: "Missing model file (field name: model)" });
      }

      const tags = String(req.body.tags || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const extension = path.extname(req.file.originalname || "").toLowerCase().replace(".", "");
      const filePath = `/3d-models/${req.file.filename}`;
      const modelDoc = await Model3D.create({
        title: req.body.title || path.parse(req.file.originalname).name,
        description: req.body.description || "",
        fileName: req.file.filename,
        filePath,
        format: extension || "unknown",
        fileSize: req.file.size || 0,
        tags,
      });

      return res.status(201).json(formatModelResponse(modelDoc));
    } catch (innerError) {
      return res.status(500).json({
        error: "Failed to save model metadata",
        detail: innerError.message,
      });
    }
  });
});

module.exports = router;
