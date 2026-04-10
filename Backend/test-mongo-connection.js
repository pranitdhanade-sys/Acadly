#!/usr/bin/env node
/**
 * MongoDB Connection Test
 * Diagnoses MongoDB Atlas connection issues
 */

const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/acadly_videos";

console.log("\n" + "=".repeat(70));
console.log("🧪 MONGODB CONNECTION DIAGNOSTIC");
console.log("=".repeat(70));

console.log("\n📋 Connection Details:");
console.log(`   URI: ${MONGO_URI}`);
console.log(`   Env MONGO_URI: ${process.env.MONGO_URI}`);

console.log("\n🔗 Attempting connection...\n");

async function testConnection() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });

    console.log("✅ Connection successful!");
    console.log(`   Database: ${mongoose.connection.db.getName()}`);
    console.log(`   Host: ${mongoose.connection.host}`);

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📚 Collections found: ${collections.length}`);
    collections.forEach(c => console.log(`   - ${c.name}`));

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected\n");

  } catch (error) {
    console.error("\n❌ Connection failed!");
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);

    if (error.message.includes("bad auth")) {
      console.error("\n⚠️  AUTHENTICATION ERROR");
      console.error("   - Check username/password in MongoDB Atlas");
      console.error("   - Verify IP is whitelisted (Network Access)");
      console.error("   - Special characters in password must be URL-encoded");
      console.error("   - Example: ! becomes %21");
    } else if (error.message.includes("ENOTFOUND")) {
      console.error("\n⚠️  DNS/NETWORK ERROR");
      console.error("   - Check your internet connection");
      console.error("   - Verify cluster name is correct");
    }

    console.error("\n");
    process.exit(1);
  }
}

testConnection();
