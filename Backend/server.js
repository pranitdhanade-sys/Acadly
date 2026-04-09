// Load environment variables from .env in the project root
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// TLS Configuration (optional)
const shouldForceHttps = process.env.FORCE_HTTPS === "true";
const tlsKeyPath = process.env.TLS_KEY_PATH || null;
const tlsCertPath = process.env.TLS_CERT_PATH || null;
const tlsCaPath = process.env.TLS_CA_PATH || null;

// -------------------- MIDDLEWARE -------------------- //
if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    hsts: IS_PRODUCTION
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (shouldForceHttps) {
  app.use((req, res, next) => {
    if (req.secure) return next();
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Absolute path to Frontend folder (moved from Frontend 2.0)
const FRONTEND_PATH = path.join(__dirname, "../Frontend");

// Serve static files
app.use(
  express.static(FRONTEND_PATH, {
    etag: true,
    lastModified: true,
    maxAge: IS_PRODUCTION ? "7d" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
        return;
      }
      res.setHeader(
        "Cache-Control",
        IS_PRODUCTION ? "public, max-age=604800, immutable" : "no-cache"
      );
    },
  })
);

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


// 3D model hub routes (MongoDB metadata + Frontend/3d-models files)
try {
  const modelRoutes = require("./routes/models3d");
  app.use("/api/models", modelRoutes);
  console.log("✅ 3D model routes mounted at /api/models");
} catch (err) {
  console.warn("⚠️  3D model routes not found:", err.message);
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


// Roadmap routes (JWT-protected learning path progress + activity)
try {
  const roadmapRoutes = require("./routes/roadmap");
  app.use("/api/roadmap", roadmapRoutes);
  console.log("✅ Roadmap routes mounted at /api/roadmap");
} catch (err) {
  console.warn("⚠️  Roadmap routes not found:", err.message);
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

// Video player page (live version with auto-resume)
app.get("/videoplayer", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "videoplayer-live.html"));
});

// Video player live page
app.get("/videoplayer-live", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "videoplayer-live.html"));
});

// PDF upload page
app.get("/upload", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "upload.html"));
});

// Video upload page
app.get("/video-upload", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "video-upload.html"));
});

// 3D lab page
app.get("/3d-lab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "3d-lab.html"));
});

// 3D model upload page
app.get("/3d-upload", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "3d-upload.html"));
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
const canStartTlsServer = tlsKeyPath && tlsCertPath;

if (canStartTlsServer) {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(tlsKeyPath)),
    cert: fs.readFileSync(path.resolve(tlsCertPath)),
  };

  if (tlsCaPath) {
    httpsOptions.ca = fs.readFileSync(path.resolve(tlsCaPath));
  }

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔐 HTTPS server running at https://localhost:${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, () => {
    console.log(`🚀 HTTP server running at http://localhost:${PORT}`);
    console.log("ℹ️ TLS not enabled. Set TLS_KEY_PATH and TLS_CERT_PATH to enable HTTPS.");
  });
}
