/**
 * Backend/setup-db.js
 * --------------------
 * Run once to initialise the MySQL database:
 *   node Backend/setup-db.js
 *
 * Executes:  DataBase/schema.sql  (creates all tables)
 *        +   DataBase/seed_videos.sql  (inserts 8 AI learning videos)
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mysql = require("mysql2");
const fs    = require("fs");
const path  = require("path");

const DB_ROOT = path.join(__dirname, "../DataBase");

// Connect without specifying a database so we can CREATE it
const connection = mysql.createConnection({
  host    : process.env.DB_HOST     || "localhost",
  port    : Number(process.env.DB_PORT) || 3306,
  user    : process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

connection.connect((err) => {
  if (err) {
    console.error("\u274c  Cannot connect to MySQL:", err.message);
    console.error("     Make sure MySQL is running and your .env credentials are correct.");
    process.exit(1);
  }
  console.log("\u2705  Connected to MySQL server");

  const files = [
    path.join(DB_ROOT, "schema.sql"),
    path.join(DB_ROOT, "seed_videos.sql"),
  ];

  let completed = 0;

  files.forEach((filePath) => {
    const sql = fs.readFileSync(filePath, "utf8");
    const label = path.basename(filePath);

    connection.query(sql, (err) => {
      if (err) {
        console.error(`\u274c  Error running ${label}:`, err.message);
      } else {
        console.log(`\u2705  ${label} executed successfully`);
      }

      completed++;
      if (completed === files.length) {
        connection.end();
        console.log("\n\ud83c\udf89  Database setup complete!");
        console.log("    Start the server:  npm start  (inside Backend/)");
      }
    });
  });
});
