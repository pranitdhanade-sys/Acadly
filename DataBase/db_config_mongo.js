// DataBase/db_config_mongo.js
// MongoDB connection pool with GridFS support for Acadly video streaming

const mongoose = require("./resolve-mongoose");

// Get MongoDB URI from environment or use local default
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/acadly_videos";

/**
 * Connect to MongoDB and return mongoose connection
 * Reuses existing connection if already established
 */
async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("✅ MongoDB already connected");
    return mongoose.connection;
  }

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });

    const dbName = mongoose.connection?.db?.databaseName || "(database)";
    console.log("✅ MongoDB connected successfully →", dbName);
    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
}

/**
 * Get GridFS bucket instance for video storage
 * Must be called after MongoDB is connected
 */
function getGridFSBucket(bucketName = "videos") {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB not connected. Call connectMongoDB() first.");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName,
  });
}

/**
 * Close MongoDB connection gracefully
 */
async function closeMongoDB() {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
  } catch (error) {
    console.error("❌ Error closing MongoDB:", error.message);
  }
}

module.exports = {
  connectMongoDB,
  getGridFSBucket,
  closeMongoDB,
  mongoose,
};
