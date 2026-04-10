# 🎬 Acadly MongoDB GridFS Video Streaming Architecture

## ✅ Implementation Complete

Your Acadly platform has been upgraded with **MongoDB GridFS video streaming** while keeping MySQL for authentication, user data, and progress tracking.

---

## 📊 What Was Changed

### 1. **Dependencies Updated** (`Backend/package.json`)
- ✅ Added `mongoose` v8.0.0 - MongoDB ODM
- ✅ Added `mongoose-gridfs` v2.0.0 - GridFS support for large files
- ✅ Added `multer` v1.4.5 - File upload handling

**Install with:**
```bash
cd Backend
npm install
```

### 2. **MongoDB Connection** (`DataBase/db_config_mongo.js`) - NEW
- Connects to MongoDB via `MONGO_URI` environment variable
- Provides `getGridFSBucket()` for file streaming
- Handles connection pooling and graceful failures

### 3. **Video Schemas** (`DataBase/schema-mongo.js`) - NEW
- **VideoMetadata**: Stores video info, duration, fileSize, XP rewards, view counts
- **VideoFeedback**: Optional user ratings/reviews for videos
- Text indexes on title + description for full-text search

### 4. **Server Initialization** (`Backend/server.js`)
- ✅ Initializes MongoDB connection at startup
- ✅ Falls back gracefully if MongoDB unavailable
- ✅ Keeps existing MySQL connection intact

### 5. **Video API Routes** (`Backend/routes/videos.js`) - REFACTORED
**Removed unused MySQL category/topic/subcategory endpoints**
**Added streaming endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/videos/` | GET | List all published videos (MongoDB) |
| `GET /api/videos/:id/metadata` | GET | Get video metadata (MongoDB) |
| **`GET /api/videos/:id/stream`** | GET | **Stream video file (GridFS)** |
| `POST /api/videos/upload` | POST | Upload new video to GridFS (Admin) |
| `PUT /api/videos/:id/metadata` | PUT | Update video metadata (Admin) |
| `DELETE /api/videos/:id` | DELETE | Delete video + file (Admin) |
| `GET /api/videos/search/:query` | GET | Full-text search (MongoDB) |
| `POST /api/videos/:id/progress` | POST | Track watch progress (MySQL) |
| `GET /api/videos/:id/user-progress` | GET | Get user's progress (MySQL) |

### 6. **Video Player** (`Frontend/videoplayer.html`)
- ✅ Updated video endpoint: `/api/videos/:id/stream`
- ✅ Changed demo badge to "Live from MongoDB"
- ✅ Updated progress tracking to use MongoDB video IDs
- ✅ Supports HTTP range requests for seeking

### 7. **Environment Config** (`.env.example`)
- ✅ Added `MONGO_URI` setting
- ✅ Template for local and MongoDB Atlas connections

---

## 🚀 How to Get Started

### Step 1: Install Dependencies
```bash
cd Backend
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
# MySQL (existing setup)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=acadly_db

# MongoDB (NEW)
MONGO_URI=mongodb://localhost:27017/acadly_videos
```

**MongoDB Options:**
- **Local Development**: `mongodb://localhost:27017/acadly_videos`
- **MongoDB Atlas (Cloud)**: `mongodb+srv://username:password@cluster.mongodb.net/acadly_videos`

### Step 3: Start MongoDB (if local)
```bash
# Windows with MongoDB installed
mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongo mongo:latest
```

### Step 4: Start Server
```bash
cd Backend
npm start
# Server runs at http://localhost:3000
```

You'll see:
```
✅ MySQL pool initialized
✅ MongoDB connected for video streaming
✅ Video routes mounted at /api/videos
✅ Server running at http://localhost:3000
```

---

## 📁 Data Flow: User Watches Video

```
1. User opens /videoplayer
   ↓
2. Clicks video in playlist (e.g., MongoDB ID: 507f1f77bcf86cd799439011)
   ↓
3. Browser: fetch('/api/videos/507f1f77bcf86cd799439011/stream')
   ↓
4. Backend route:
   a) Validate ObjectId format
   b) Look up VideoMetadata in MongoDB
   c) Check if published & active
   d) Open GridFS download stream
   e) Send video bytes with proper MIME type & range support
   ↓
5. HTML5 <video> element receives stream
   ↓
6. User watches → timeupdate events → localStorage saves progress
   ↓
7. Video completes or quiz submitted:
   POST /api/videos/:id/progress
   └─→ MySQL records completion + awards XP
```

---

## 🎯 API Examples

### Upload a Video (Admin/Teacher)
```bash
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "videoFile=@myvideo.mp4" \
  -F "title=Machine Learning Basics" \
  -F "category=AI" \
  -F "duration=1200" \
  -F "description=An intro to ML concepts"
```

Response:
```json
{
  "message": "Video uploaded successfully",
  "video_id": "507f1f77bcf86cd799439011",
  "file_id": "507f1f77bcf86cd799439001"
}
```

### Stream Video
```bash
# Simple stream
curl http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream \
  -o video.mp4

# With range request (for seeking)
curl -H "Range: bytes=1000-2000" \
  http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream
```

### Track Progress
```bash
curl -X POST http://localhost:3000/api/videos/507f1f77bcf86cd799439011/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "watch_seconds": 600,
    "completed": 1,
    "quiz_score": 100
  }'
```

Response:
```json
{ "message": "Progress tracked" }
```

---

## 🔐 Authentication

The refactored `/api/videos/:id/progress` endpoint requires JWT token:

```javascript
// On frontend
const token = localStorage.getItem("auth_token");
fetch(`/api/videos/${videoId}/progress`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ completed: 1, watch_seconds: 600 })
});
```

---

## 📊 Database Schema at a Glance

### MongoDB: VideoMetadata
```javascript
{
  _id: ObjectId,
  file_id: ObjectId,          // GridFS file reference
  title: String,
  description: String,
  category: String,           // e.g., "Machine Learning"
  subcategory: String,
  duration: Number,           // seconds
  format: String,             // "mp4", "webm"
  mimeType: String,           // "video/mp4"
  fileSize: Number,           // bytes
  thumbnail: String,          // URL or base64
  xpReward: Number,           // Default: 25
  isPublished: Boolean,
  isActive: Boolean,
  views: Number,
  rating: Number,             // 0-5
  uploadedBy: Number,         // MySQL user_id
  uploadedAt: Date,
  tags: [String]
}
```

### MySQL: user_video_progress (Unchanged)
```sql
user_id, video_id, watch_seconds, completed, quiz_score, xp_awarded, last_watched
```

---

## ⚠️ Important Notes

1. **Video IDs Changed**: Old numeric IDs → MongoDB ObjectIds
   - Update frontend references to use correct MongoDB IDs
   - Existing MySQL progress tracking still works (video_id is just stored as string)

2. **GridFS Limits**: 
   - Max file size: 5GB (configurable in `routes/videos.js`)
   - Supported formats: MP4, WebM, MOV

3. **Range Requests**: Fully supported for seeking in videos
   - Browser can seek without downloading entire file first

4. **Backward Compatibility**:
   - MySQL progress tracking unchanged
   - Auth routes unchanged
   - Dashboard API unchanged

5. **Performance**:
   - Index on `isPublished + isActive` for fast queries
   - Text indexes on `title + description` for full-text search
   - View count incremented on each stream request

---

## 🧪 Testing the Integration

### 1. Test MongoDB Connection
```bash
# In Backend folder
node -e "
const { connectMongoDB } = require('./DataBase/db_config_mongo.js');
connectMongoDB().then(() => console.log('✅ Connected!')).catch(e => console.error('❌', e.message));
"
```

### 2. Test Video Streaming
```bash
# Upload test video
curl -X POST http://localhost:3000/api/videos/upload \
  -H "Authorization: Bearer test_token" \
  -F "videoFile=@test.mp4" \
  -F "title=Test Video" \
  -F "category=Testing" \
  -F "duration=60"

# Then stream it using the returned video_id
curl http://localhost:3000/api/videos/{returned_video_id}/stream -o downloaded.mp4
```

### 3. Test Frontend
```bash
1. Start server: npm start
2. Open http://localhost:3000/videoplayer
3. Click a video in the playlist
4. Should stream from MongoDB
```

---

## 📝 File Manifest - What Was Created/Changed

### ✅ New Files Created
- `DataBase/db_config_mongo.js` - MongoDB connection pool
- `DataBase/schema-mongo.js` - Mongoose schemas with GridFS
- `.env.example` - Updated with MONGO_URI

### ✅ Files Refactored
- `Backend/server.js` - Added MongoDB init
- `Backend/package.json` - Added mongoose, multer, mongoose-gridfs
- `Backend/routes/videos.js` - Streamlined for GridFS (old MySQL categories removed)
- `Frontend/videoplayer.html` - Update video source endpoints

### ✅ Unchanged
- MySQL connection (`db_config.js`)
- Auth routes
- Progress tracking (MySQL backend)
- User management routes
- Dashboard routes

---

## 🎓 Next Steps

1. **Update Video References**:
   - Get real MongoDB video IDs from your uploads
   - Update `Frontend/videoplayer.html` playlist with actual IDs

2. **Bulk Migrate Old Videos** (Optional):
   - Create migration script to upload old videos to MongoDB
   - Keep MySQL metadata in sync

3. **Add Admin Upload UI**:
   - Create form page for teachers to upload videos
   - Connect to `/api/videos/upload` endpoint

4. **Monitor Storage**:
   - MongoDB GridFS stores all video files
   - Monitor disk space and set retention policies

5. **Scale in Production**:
   - Use MongoDB Atlas for managed database
   - Enable encryption at rest
   - Set up automated backups

---

## 🆘 Troubleshooting

**MongoDB Connection Fails:**
- Ensure MongoDB is running: `mongod` or check Docker
- Check `.env` MONGO_URI is correct
- Test: `mongo mongodb://localhost:27017/acadly_videos`

**Video Won't Stream:**
- Check file_id in VideoMetadata matches GridFS
- Verify `isPublished: true` in metadata
- Check browser console for 404/403 errors

**Upload Times Out:**
- Increase multer `fileSize` limit in `routes/videos.js`
- Check network speed and MongoDB connection
- Monitor MongoDB logs

**Progress Not Saving:**
- Verify auth_token is in localStorage
- Check JWT token is valid
- Ensure MySQL connection is working

---

## 📚 References

- [MongoDB GridFS Docs](https://www.mongodb.com/docs/manual/core/gridfs/)
- [Mongoose GridFS](https://www.npmjs.com/package/mongoose-gridfs)
- [HTTP Range Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)
- [HTML5 Video](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video)

---

## ✨ Summary

Your Acadly platform now has:
- ✅ **MongoDB GridFS** for efficient video storage & streaming
- ✅ **Refactored API** with clean streaming endpoints
- ✅ **HTTP Range Support** for seek-without-download
- ✅ **Full-Text Search** on videos
- ✅ **Backward Compatible** progress tracking via MySQL
- ✅ **Production Ready** error handling and validation

**Happy teaching! 🎓📹**
