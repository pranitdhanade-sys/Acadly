# 📹 Video Upload & Access Guide for Acadly

Complete workflow to upload videos to MongoDB GridFS and access them from the video player.

---

## 🎯 Architecture Overview

```
Your Local Videos Folder
        ↓
    Upload Script or API
        ↓
    MongoDB GridFS (stores video files)
    MongoDB VideoMetadata (stores metadata)
        ↓
    Video Streaming Endpoint: GET /api/videos/:video_id/stream
        ↓
    Frontend videoplayer.html displays video
```

---

## 📋 Prerequisites

✅ **Already Done:**
- Express server running at `http://localhost:3000`
- MongoDB running on `localhost:27017` (or Atlas connection)
- Backend routes with upload endpoint at `POST /api/videos/upload`

✅ **Your Setup:**
- Videos folder: `d:\HACKATHON PROJECTS\Acadly02-main\Videos`
- Your video files: `OOPs.mp4`, `[Video2].mp4`, `[Video3].mp4` (or similar)

---

## 🚀 Method 1: Using Node.js Upload Script (RECOMMENDED)

### Step 1: Create Upload Script

Create file: `Backend/upload-videos.js`

```javascript
// Upload videos to MongoDB GridFS from local folder
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/acadly_videos";

// Video metadata schema
const VideoMetadataSchema = new mongoose.Schema({
  file_id: mongoose.Schema.Types.ObjectId,
  title: String,
  description: String,
  category: String,
  subcategory: String,
  duration: Number,
  format: String,
  mimeType: String,
  fileSize: Number,
  uploadedBy: mongoose.Schema.Types.ObjectId,
  isPublished: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  xpReward: { type: Number, default: 25 },
  tags: [String],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const VideoMetadata = mongoose.model("VideoMetadata", VideoMetadataSchema);

// Get GridFS bucket
function getGridFSBucket() {
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "videos",
  });
  return bucket;
}

// Upload video function
async function uploadVideo(videoPath, metadata) {
  try {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    const fileStats = fs.statSync(videoPath);
    const fileName = path.basename(videoPath);
    const fileSize = fileStats.size;

    console.log(`📤 Uploading: ${fileName} (${(fileSize / (1024 * 1024)).toFixed(2)} MB)`);

    // Upload to GridFS
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: "video/mp4",
    });

    // Pipe file to GridFS
    fs.createReadStream(videoPath).pipe(uploadStream);

    return new Promise((resolve, reject) => {
      uploadStream.on("finish", async () => {
        try {
          // Save metadata
          const videoDoc = new VideoMetadata({
            file_id: uploadStream.id,
            title: metadata.title || fileName.replace(".mp4", ""),
            description: metadata.description || "Uploaded video",
            category: metadata.category || "General",
            subcategory: metadata.subcategory || "Uncategorized",
            duration: metadata.duration || 0,
            format: "mp4",
            mimeType: "video/mp4",
            fileSize: fileSize,
            uploadedBy: metadata.uploadedBy || null,
            isPublished: true,
            isActive: true,
            xpReward: metadata.xpReward || 25,
            tags: metadata.tags || [],
          });

          const saved = await videoDoc.save();

          console.log(`✅ Success! Video ID: ${saved._id}`);
          console.log(`   Title: ${saved.title}`);
          console.log(`   File ID (GridFS): ${uploadStream.id}`);
          console.log(`   Stream URL: http://localhost:3000/api/videos/${saved._id}/stream\n`);

          resolve(saved);
        } catch (error) {
          reject(error);
        }
      });

      uploadStream.on("error", reject);
    });
  } catch (error) {
    console.error(`❌ Upload failed: ${error.message}`);
    throw error;
  }
}

// Main upload process
async function main() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB\n");

    // Define videos to upload from your Videos folder
    const videosToUpload = [
      {
        filePath: "../Videos/OOPs.mp4", // relative to Backend folder
        metadata: {
          title: "Object-Oriented Programming (OOPs)",
          description: "Complete guide to OOP concepts, classes, and inheritance",
          category: "Programming",
          subcategory: "Advanced",
          duration: 3600, // 60 minutes in seconds
          xpReward: 50,
          tags: ["OOP", "Java", "Programming"],
        },
      },
      // Add more videos here:
      // {
      //   filePath: "../Videos/Video2.mp4",
      //   metadata: {
      //     title: "Your Video Title",
      //     description: "Video description",
      //     category: "Category Name",
      //     subcategory: "Subcategory",
      //     duration: 1800,
      //     xpReward: 30,
      //     tags: ["tag1", "tag2"],
      //   },
      // },
    ];

    console.log(`📋 Found ${videosToUpload.length} video(s) to upload\n`);

    const uploadedVideos = [];
    for (const video of videosToUpload) {
      const fullPath = path.join(__dirname, video.filePath);
      try {
        const result = await uploadVideo(fullPath, video.metadata);
        uploadedVideos.push(result);
      } catch (error) {
        console.error(`⚠️  Skipped: ${video.filePath}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`✅ Upload Complete! ${uploadedVideos.length} video(s) uploaded`);
    console.log("=".repeat(60) + "\n");

    console.log("📺 Videos in MongoDB:");
    uploadedVideos.forEach((v, i) => {
      console.log(`${i + 1}. ${v.title} (ID: ${v._id})`);
      console.log(`   Stream: http://localhost:3000/api/videos/${v._id}/stream\n`);
    });

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
```

### Step 2: Run Upload Script

```bash
# Navigate to Backend folder
cd "d:\HACKATHON PROJECTS\Acadly02-main\Backend"

# Run upload script
node upload-videos.js
```

**Expected Output:**
```
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📋 Found 1 video(s) to upload

📤 Uploading: OOPs.mp4 (145.50 MB)
✅ Success! Video ID: 507f1f77bcf86cd799439011
   Title: Object-Oriented Programming (OOPs)
   File ID (GridFS): 507f1f77bcf86cd799439012
   Stream URL: http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream

============================================================
✅ Upload Complete! 1 video(s) uploaded
============================================================
```

---

## 🎬 Method 2: Using API Upload Endpoint

### Option A: Using curl Command

```bash
# Create JWT Token first (if needed)
# Then upload video with metadata

curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "videoFile=@d:\Videos\OOPs.mp4" \
  -F "title=Object-Oriented Programming" \
  -F "description=Complete OOP tutorial" \
  -F "category=Programming" \
  -F "subcategory=Advanced" \
  -F "duration=3600" \
  -F "xpReward=50" \
  -F "isPublished=true"
```

### Option B: Using Postman

1. **Create POST Request** to `http://localhost:3000/api/videos/upload`
2. **Headers Tab:**
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```
3. **Body Tab:** Select `form-data`
   - `videoFile` (type: file) → Select your video
   - `title` (text) → Object-Oriented Programming
   - `description` (text) → Complete OOP tutorial
   - `category` (text) → Programming
   - `duration` (text) → 3600
   - `xpReward` (text) → 50
   - `isPublished` (text) → true
4. **Send**

---

## 📺 Accessing Videos in Video Player

### Step 1: Get Video List (Metadata)

**Endpoint:** `GET http://localhost:3000/api/videos`

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Object-Oriented Programming (OOPs)",
    "description": "Complete guide to OOP concepts",
    "category": "Programming",
    "duration": 3600,
    "xpReward": 50,
    "views": 5,
    "rating": 4.5
  }
]
```

### Step 2: Stream Single Video

**Endpoint:** `GET http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream`

This endpoint:
- ✅ Returns video file as stream
- ✅ Supports byte-range requests (seeking)
- ✅ Sets proper headers for video playback

### Step 3: Update Video Player Configuration

Edit: `Frontend/js/video-metadata.js`

```javascript
// Add your video to the playlist
window.acadlyVideos = [
  {
    id: "507f1f77bcf86cd799439011", // MongoDB video ID
    title: "Object-Oriented Programming (OOPs)",
    description: "Complete guide to OOP concepts, classes, and inheritance",
    category: "Programming",
    subcategory: "Advanced",
    duration: "60:00", // formatted as mm:ss
    thumbnail: null, // Generate from first frame
    src: "/api/videos/507f1f77bcf86cd799439011/stream", // Stream endpoint
    quiz: [],
    xpReward: 50,
  },
  // Add more videos here...
];
```

---

## 🔄 Complete Workflow Example

### Workflow: Upload 3 Videos & Access in Player

**Step 1: Prepare videos**
```
d:\HACKATHON PROJECTS\Acadly02-main\Videos\
├── OOPs.mp4
├── DataStructures.mp4
└── Algorithms.mp4
```

**Step 2: Create upload script with all 3 videos**

Edit `Backend/upload-videos.js` and add:
```javascript
const videosToUpload = [
  {
    filePath: "../Videos/OOPs.mp4",
    metadata: {
      title: "Object-Oriented Programming",
      category: "Programming",
      duration: 3600,
    },
  },
  {
    filePath: "../Videos/DataStructures.mp4",
    metadata: {
      title: "Data Structures",
      category: "Programming",
      duration: 2400,
    },
  },
  {
    filePath: "../Videos/Algorithms.mp4",
    metadata: {
      title: "Algorithm Design",
      category: "Programming",
      duration: 2000,
    },
  },
];
```

**Step 3: Run upload script**
```bash
cd Backend
node upload-videos.js
```

**Step 4: Get video IDs from output**
```
✅ Success! Video ID: 507f1f77bcf86cd799439011
✅ Success! Video ID: 507f1f77bcf86cd799439022
✅ Success! Video ID: 507f1f77bcf86cd799439033
```

**Step 5: Update video metadata in Frontend**
```javascript
// Frontend/js/video-metadata.js
window.acadlyVideos = [
  {
    id: "507f1f77bcf86cd799439011",
    title: "Object-Oriented Programming",
    src: "/api/videos/507f1f77bcf86cd799439011/stream",
  },
  {
    id: "507f1f77bcf86cd799439022",
    title: "Data Structures",
    src: "/api/videos/507f1f77bcf86cd799439022/stream",
  },
  {
    id: "507f1f77bcf86cd799439033",
    title: "Algorithm Design",
    src: "/api/videos/507f1f77bcf86cd799439033/stream",
  },
];
```

**Step 6: Play video in browser**
```
1. Visit http://localhost:3000/Frontend/videoplayer.html
2. Select video from playlist
3. Click play ▶️
4. Video streams from MongoDB! 🎉
```

---

## 🐛 Troubleshooting

### ❌ "Cannot find module 'mongoose'"

**Solution:**
```bash
cd Backend
npm install mongoose
```

### ❌ "MongoServerError: connect ECONNREFUSED 127.0.0.1:27017"

**Solution:** MongoDB is not running
```bash
# Windows - Start MongoDB
# Option 1: Via MongoDB Compass (GUI)
# Option 2: Via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option 3: Via MongoDB Atlas (Cloud)
set MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/acadly_videos
```

### ❌ "Stream error: Cannot find GridFS bucket"

**Solution:** Make sure MongoDB is initialized before uploading
```bash
# In Backend folder, first run:
node server.js  # This initializes MongoDB connection

# Then in another terminal:
node upload-videos.js
```

### ❌ Video doesn't play in browser

**Check:**
1. Video ID is correct: `http://localhost:3000/api/videos/{ID}/stream`
2. File exists in MongoDB: Check database with MongoDB Compass
3. MIME type is correct: Should be `video/mp4`

---

## 📊 Verify Upload Success

### Check MongoDB Collections

**Use MongoDB Compass:**
1. Connect to `mongodb://localhost:27017`
2. Database: `acadly_videos`
3. Collections to check:
   - `videos.files` (GridFS files)
   - `videometadatas` (Metadata documents)

**Expected:**
- `videos.files`: Contains binary video data
- `videometadatas`: Contains metadata with `file_id` matching GridFS

---

## ✅ Quick Checklist

- [ ] MongoDB running (`mongod` or Docker)
- [ ] Backend server running (`npm start`)
- [ ] Videos in `d:\HACKATHON PROJECTS\Acadly02-main\Videos` folder
- [ ] Upload script created: `Backend/upload-videos.js`
- [ ] Upload script configured with video paths
- [ ] Run: `node upload-videos.js`
- [ ] Copy returned video IDs
- [ ] Update `Frontend/js/video-metadata.js` with video IDs
- [ ] Visit videoplayer.html and play videos
- [ ] Video streams from MongoDB! 🎉

---

## 🎓 Next Steps

After uploading videos:
1. **Add Metadata:** Thumbnails, descriptions, tags
2. **Configure Quiz:** Add quiz questions per video
3. **Track Analytics:** Monitor views, completion, ratings
4. **Set Permissions:** Control who can upload (admin/teacher role)
