// Load environment variables from .env in the project root
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- MIDDLEWARE -------------------- //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Absolute path to Frontend folder (moved from Frontend 2.0)
const FRONTEND_PATH = path.join(__dirname, "../Frontend");

// Serve static files
app.use(express.static(FRONTEND_PATH));

// -------------------- DATABASE INITIALIZATION -------------------- //
// Initialize MySQL connection (existing)
try {
  const mysqlPool = require("../DataBase/db_config");
  console.log("✅ MySQL pool initialized");
} catch (err) {
  console.warn("⚠️  MySQL connection failed:", err.message);
}

// Initialize MongoDB connection for video streaming
(async () => {
  try {
    const { connectMongoDB, initializeCollections } = require("../DataBase/db_config_mongo");
    const { initializeCollections: mongoInit } = require("../DataBase/schema-mongo");

    await connectMongoDB();
    await mongoInit();
    console.log("✅ MongoDB initialized for video streaming");
  } catch (err) {
    console.warn("⚠️  MongoDB connection failed:", err.message);
    console.warn("⚠️  Video streaming will not be available until MongoDB is configured");
  }
})();

// -------------------- ROUTES -------------------- //

// Auth routes (registration, login, token management)
try {
  const authRoutes = require("./routes/auth");
  app.use("/api/auth", authRoutes);
  console.log("✅ Auth routes mounted at /api/auth");
} catch (err) {
  console.warn("⚠️  Auth routes not found:", err.message);
}

// User management routes (dashboard, attendance, progress)
try {
  const userManagementRoutes = require("./routes/user-management");
  app.use("/api/users", userManagementRoutes);
  console.log("✅ User management routes mounted at /api/users");
} catch (err) {
  console.warn("⚠️  User management routes not found:", err.message);
}

// Video playlist routes (with hierarchical categories and upload)
const videoRoutes = require("./routes/videos");
app.use("/api/videos", videoRoutes);
console.log("✅ Video routes mounted at /api/videos");

// PDF library routes (MongoDB metadata + /Frontend/pdfs files)
try {
  const pdfLibraryRoutes = require("./routes/pdf-library");
  app.use("/api/pdfs", pdfLibraryRoutes);
  console.log("✅ PDF library routes mounted at /api/pdfs");
} catch (err) {
  console.warn("⚠️  PDF library routes not found:", err.message);
}

// Basic progress routes (XP / video completion)
try {
  const progressRoutes = require("./routes/progress");
  app.use("/api/progress", progressRoutes);
  console.log("✅ Progress routes mounted at /api/progress");
} catch (err) {
  console.warn("⚠️  Progress routes not found:", err.message);
}

// Dashboard v2 (MySQL-backed UI data)
try {
  const dashboardRoutes = require("./routes/dashboard");
  app.use("/api/dashboard", dashboardRoutes);
  console.log("✅ Dashboard routes mounted at /api/dashboard");
} catch (err) {
  console.warn("⚠️  Dashboard routes not found:", err.message);
}

// Practice lab routes (quiz configuration + test generation)
try {
  const practiceLabRoutes = require("./routes/practicelab");
  app.use("/", practiceLabRoutes);
  console.log("✅ Practice lab routes mounted");
} catch (err) {
  console.warn("⚠️  Practice lab routes not found:", err.message);
}

// Blog listing page
app.get("/blogs", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "blogs.html"));
});

// Blog editor page
app.get("/blog-editor", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "blog-editor.html"));
});

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "Homepage.html"));
});

// Optional home alias
app.get("/home", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "Homepage.html"));
});

app.get("/chatbot", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "chatbot.html"));
});

app.get("/library", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "library.html"));
});

// Video player page
app.get("/videoplayer", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "videoplayer.html"));
});

// Video upload page
app.get("/upload", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "upload.html"));
});

// -------------------- ADMIN ROUTES (owner-only) -------------------- //
// Protected by x-admin-key header — see DataBase/admin_middleware.js
try {
  const adminRoutes = require("../DataBase/admin_routes");
  app.use("/api/admin", adminRoutes);
  console.log("🔒 Admin routes mounted at /api/admin");
} catch (err) {
  console.warn("Admin routes could not be loaded:", err.message);
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server running 🚀" });
});

// -------------------- 404 HANDLER -------------------- //
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -------------------- SERVER -------------------- //
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
