/**
 * Backend/db_config.js
 * ---------------------
 * Shared MySQL2 promise pool for the entire Acadly backend.
 * Configuration is read from environment variables (see .env.example).
 * SERVER-SIDE ONLY — never expose this file to the browser.
 */

"use strict";

const mysql = require("mysql2/promise");
const path  = require("path");

// Load .env from the project root
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const pool = mysql.createPool({
  host              : process.env.DB_HOST     || "localhost",
  port              : Number(process.env.DB_PORT) || 3306,
  user              : process.env.DB_USER     || "root",
  password          : process.env.DB_PASSWORD || "",
  database          : process.env.DB_NAME     || "acadly_db",
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  timezone          : "Z",
});

// Verify the connection on startup — warn but don't crash if MySQL is offline
pool.getConnection()
  .then((conn) => {
    console.log("✅  MySQL connected  → database:", process.env.DB_NAME || "acadly_db");
    conn.release();
  })
  .catch((err) => {
    console.warn(
      "⚠️   MySQL unavailable — running in demo/offline mode.",
      "\n    Error:", err.message,
      "\n    Tip: start MySQL, create the database, and run `node Backend/setup-db.js`"
    );
  });

module.exports = pool;
