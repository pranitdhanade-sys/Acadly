const express = require("express");
const path = require("path");
const fs = require("fs/promises");

const { connectMongoDB } = require("../../DataBase/db_config_mongo");
const { mongoose } = require("../../DataBase/db_config_mongo");

const router = express.Router();

const pdfSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, unique: true, trim: true },
    filePath: { type: String, required: true, trim: true },
  },
  {
    collection: "pdf_library",
    timestamps: true,
  }
);

const PdfDocument = mongoose.models.PdfDocument || mongoose.model("PdfDocument", pdfSchema);

const PDF_DIRECTORY = path.join(__dirname, "../../Frontend/pdfs");

function buildTitleFromFileName(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function syncPdfsFromFolder() {
  await fs.mkdir(PDF_DIRECTORY, { recursive: true });

  const files = await fs.readdir(PDF_DIRECTORY);
  const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

  await Promise.all(
    pdfFiles.map(async (fileName) => {
      await PdfDocument.updateOne(
        { fileName },
        {
          $setOnInsert: {
            title: buildTitleFromFileName(fileName),
            fileName,
            filePath: `/pdfs/${fileName}`,
          },
        },
        { upsert: true }
      );
    })
  );

  return PdfDocument.find().sort({ title: 1 }).lean();
}

router.get("/", async (req, res) => {
  try {
    await connectMongoDB();
    const pdfs = await syncPdfsFromFolder();

    res.json({
      message: "PDF library loaded successfully",
      count: pdfs.length,
      pdfs,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load PDF library",
      details: error.message,
    });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    await connectMongoDB();
    const pdfs = await syncPdfsFromFolder();

    res.json({
      message: "PDF library refreshed",
      count: pdfs.length,
      pdfs,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to refresh PDF library",
      details: error.message,
    });
  }
});

module.exports = router;
