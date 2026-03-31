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

// Absolute path to Frontend folder
const FRONTEND_PATH = path.join(__dirname, "../Frontend");

// Serve static files
app.use(express.static(FRONTEND_PATH));

// -------------------- ROUTES -------------------- //

// Auth routes (may not exist yet in this hackathon fork)
try {
  const authRoutes = require("./routes/auth");
  app.use("/api/auth", authRoutes);
} catch (err) {
  console.warn("Auth routes not found yet, skipping /api/auth wiring");
}

// Video playlist routes for the AI video player
const videoRoutes = require("./routes/videos");
app.use("/api/videos", videoRoutes);

// Basic progress routes (XP / video completion demo)
const progressRoutes = require("./routes/progress");
app.use("/api/progress", progressRoutes);

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// Optional home alias
app.get("/home", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "home.html"));
});

app.get("/chatbot", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "chatbot.html"));
});

// Video player page
app.get("/videoplayer", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "videoplayer.html"));
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




// -------------------- DEMO DATA -------------------- //

let attendance = {}; // { username: Set(dates) }
let users = [];

// -------------------- API -------------------- //

// Register user
app.post("/api/register", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Missing fields" });
  }

  users.push({ name, email });

  res.json({ message: "User registered successfully" });
});

// Mark attendance
app.post("/api/attendance", (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

  const today = new Date().toISOString().split("T")[0];

  if (!attendance[username]) {
    attendance[username] = new Set();
  }

  attendance[username].add(today);

  res.json({
    message: "Attendance marked",
    date: today
  });
});

// Get streak
app.get("/api/streak/:username", (req, res) => {
  const { username } = req.params;

  if (!attendance[username]) {
    return res.json({ username, streak: 0 });
  }

  const dates = Array.from(attendance[username]).sort().reverse();

  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < dates.length; i++) {
    const d = new Date(dates[i]);

    const diff = Math.floor(
      (currentDate - d) / (1000 * 60 * 60 * 24)
    );

    if (diff === streak) {
      streak++;
    } else {
      break;
    }
  }

  res.json({ username, streak });
});

// -------------------- 404 HANDLER -------------------- //
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// -------------------- SERVER -------------------- //
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});