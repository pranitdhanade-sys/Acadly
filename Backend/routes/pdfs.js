// Backend/routes/pdfs.js
// PDF uploads and library metadata in MongoDB/GridFS.

"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");

const { connectMongoDB, getGridFSBucket } = require("../../DataBase/db_config_mongo");
const { PdfDocument } = require("../../DataBase/schema-mongo");

const router = express.Router();
const GRIDFS_BUCKET = "pdfs";
const LOCAL_PDFS_DIR = path.join(__dirname, "../../pdfs");

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(LOCAL_PDFS_DIR, { recursive: true });
      cb(null, LOCAL_PDFS_DIR);
    },
    filename: (req, file, cb) => {
      const safeBase = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9-_]/g, "_")
        .slice(0, 80);
      cb(null, `${Date.now()}-${safeBase || "document"}.pdf`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (file.mimetype === "application/pdf" || ext === ".pdf") {
      cb(null, true);
      return;
    }
    cb(new Error("Only PDF files are allowed"));
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

function isObjectIdString(id) {
  return typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id);
}

async function ensureMongo() {
  if (mongoose.connection.readyState !== 1) {
    await connectMongoDB();
  }
}

function toLibraryItem(doc) {
  const plain = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  return {
    id: String(plain._id),
    title: plain.title,
    description: plain.description || "",
    category: plain.category || "General",
    tags: plain.tags || [],
    fileSize: plain.fileSize || 0,
    uploadedAt: plain.uploadedAt,
    viewUrl: `/api/pdfs/${String(plain._id)}/file`,
  };
}

router.get("/", async (req, res) => {
  try {
    await ensureMongo();
    const docs = await PdfDocument.find({ isActive: true }).sort({ uploadedAt: -1 }).exec();
    res.json(docs.map(toLibraryItem));
  } catch (err) {
    console.error("GET /api/pdfs:", err.message);
    res.status(503).json({ error: "PDF library unavailable", detail: err.message });
  }
});

router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    await ensureMongo();
    if (!req.file) {
      return res.status(400).json({ error: "Missing file (use field name: pdf)" });
    }

    const bucket = getGridFSBucket(GRIDFS_BUCKET);
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: "application/pdf",
    });

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(uploadStream)
        .on("error", reject);
      uploadStream.on("error", reject);
      uploadStream.on("finish", resolve);
    });

    const doc = await PdfDocument.create({
      file_id: uploadStream.id,
      title: req.body.title || path.parse(req.file.originalname).name,
      description: req.body.description || "",
      category: req.body.category || "General",
      tags: req.body.tags
        ? String(req.body.tags)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      fileSize: req.file.size,
      mimeType: "application/pdf",
      localFilePath: req.file.path,
      isActive: true,
    });

    res.status(201).json(toLibraryItem(doc));
  } catch (err) {
    console.error("POST /api/pdfs/upload:", err.message);
    res.status(500).json({ error: "Upload failed", detail: err.message });
  }
});

router.get("/:id/file", async (req, res) => {
  try {
    await ensureMongo();
    const { id } = req.params;
    if (!isObjectIdString(id)) {
      return res.status(400).json({ error: "Invalid pdf id" });
    }

    const pdf = await PdfDocument.findById(id).lean();
    if (!pdf || !pdf.isActive || !pdf.file_id) {
      return res.status(404).json({ error: "PDF not found" });
    }

    const bucket = getGridFSBucket(GRIDFS_BUCKET);
    const fileObjectId = new mongoose.Types.ObjectId(pdf.file_id);
    const stream = bucket.openDownloadStream(fileObjectId);

    res.setHeader("Content-Type", "application/pdf");
    const safeTitle = String(pdf.title || "document").replace(/[^a-zA-Z0-9-_ ]/g, "_");
    res.setHeader("Content-Disposition", `inline; filename=\"${safeTitle}.pdf\"`);

    stream.on("error", (e) => {
      console.error("PDF stream error:", e.message);
      if (!res.headersSent) res.status(500).json({ error: "File stream failed" });
    });

    stream.pipe(res);
  } catch (err) {
    console.error("GET /api/pdfs/:id/file:", err.message);
    res.status(500).json({ error: "Failed to fetch PDF" });
  }
});

module.exports = router;
