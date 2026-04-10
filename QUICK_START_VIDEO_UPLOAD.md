# 🎬 Quick Start: Upload & Play Videos (5-Minute Setup)

## 📋 You Have:
- 2-3 videos in `Videos` folder: `OOPs.mp4`, etc.
- Backend running at `http://localhost:3000`
- MongoDB available

---

## ⚡ Step 1: Upload Your Videos to MongoDB

### Option A: Using the Upload Script (EASIEST)

```bash
# 1. Make sure MongoDB is running:
#    - Option 1: MongoDB locally (mongod running)
#    - Option 2: MongoDB Atlas (set MONGO_URI environment variable)

# 2. Open PowerShell/Terminal

# 3. Navigate to Backend folder
cd "d:\HACKATHON PROJECTS\Acadly02-main\Backend"

# 4. Run upload script
node upload-videos.js
```

**Expected Output:**
```
🎬 ACADLY VIDEO UPLOADER
======================================================================

🔗 Connecting to MongoDB: mongodb://localhost:27017/acadly_videos
✅ Connected to MongoDB

📋 Ready to upload: 1 video(s)

[1/1] Object-Oriented Programming (OOPs)

📤 Uploading: OOPs.mp4
   Size: 145.50 MB
   ✅ Uploaded successfully
   Video ID: 507f1f77bcf86cd799439011
   Stream URL: http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream

======================================================================
✅ Upload Complete! 1/1 video(s) uploaded
======================================================================

🎯 Next Steps:
1. Copy the Video IDs below
2. Update Frontend/js/video-metadata.js with these IDs

📺 Uploaded Videos:

1. Object-Oriented Programming (OOPs)
   Video ID:   507f1f77bcf86cd799439011
   Stream URL: http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream
```

**Copy the Video ID:** `507f1f77bcf86cd799439011`

---

## 🎥 Step 2: Configure Video Player to Use Your Video

### Edit: `Frontend/js/video-metadata.js`

Replace the entire content with:

```javascript
/**
 * Acadly Video Metadata
 * Defines all videos available in the platform
 */

// ====== VIDEO DATA ======
window.acadlyVideos = [
  {
    id: "507f1f77bcf86cd799439011", // <- Your Video ID from MongoDB
    title: "Object-Oriented Programming (OOPs)",
    description: "Complete guide to OOP concepts, classes, inheritance, and polymorphism",
    category: "Programming",
    subcategory: "Advanced",
    duration: "60:00",
    thumbnail: null,
    src: "/api/videos/507f1f77bcf86cd799439011/stream", // <- Same Video ID
    tags: ["OOP", "Programming", "Java"],
    xpReward: 50,
    rating: 4.5,
    views: 125,
    quiz: [], // Optional: Add quiz questions later
  },
  // Add more videos here if you have multiple:
  // {
  //   id: "507f1f77bcf86cd799439022",
  //   title: "Data Structures",
  //   src: "/api/videos/507f1f77bcf86cd799439022/stream",
  // },
];

// Default video (first in list)
window.currentVideoId = window.acadlyVideos[0]?.id || null;

// Optional: XP reward per video
window.videoXPMultiplier = {
  default: 1,
  difficult: 1.5,
  easy: 0.8,
};
```

---

## 🎬 Step 3: Play Video in Browser

1. **Start Backend Server** (if not running):
   ```bash
   cd "d:\HACKATHON PROJECTS\Acadly02-main\Backend"
   npm start
   ```

2. **Open Video Player**:
   - Visit: http://localhost:3000/Frontend/videoplayer.html
   - OR: http://localhost:3000/index.html → Click "Video Hub"

3. **Select & Play Your Video**:
   - Click on your video from the playlist
   - Click the Play button ▶️
   - Video streams from MongoDB! 🎉

---

## 📹 For Multiple Videos (2-3 Videos)

If you have `OOPs.mp4`, `DataStructures.mp4`, `Algorithms.mp4`:

### Step 1: Update Upload Script

Edit: `Backend/upload-videos.js` (lines 83-117)

```javascript
const videosToUpload = [
  {
    filePath: "OOPs.mp4",
    metadata: {
      title: "Object-Oriented Programming",
      description: "OOP concepts",
      category: "Programming",
      duration: 3600,
      xpReward: 50,
    },
  },
  {
    filePath: "DataStructures.mp4",
    metadata: {
      title: "Data Structures",
      description: "Arrays, linked lists, trees",
      category: "Programming",
      duration: 2400,
      xpReward: 35,
    },
  },
  {
    filePath: "Algorithms.mp4",
    metadata: {
      title: "Algorithm Design",
      description: "Sorting and searching",
      category: "Programming",
      duration: 2000,
      xpReward: 30,
    },
  },
];
```

### Step 2: Run Upload Script
```bash
node upload-videos.js
```

### Step 3: Copy All Video IDs from Output

Example output:
```
1. Object-Oriented Programming (OOPs)
   Video ID: 507f1f77bcf86cd799439011

2. Data Structures
   Video ID: 507f1f77bcf86cd799439022

3. Algorithm Design
   Video ID: 507f1f77bcf86cd799439033
```

### Step 4: Update `Frontend/js/video-metadata.js`

```javascript
window.acadlyVideos = [
  {
    id: "507f1f77bcf86cd799439011",
    title: "Object-Oriented Programming",
    src: "/api/videos/507f1f77bcf86cd799439011/stream",
    duration: "60:00",
    category: "Programming",
    xpReward: 50,
  },
  {
    id: "507f1f77bcf86cd799439022",
    title: "Data Structures",
    src: "/api/videos/507f1f77bcf86cd799439022/stream",
    duration: "40:00",
    category: "Programming",
    xpReward: 35,
  },
  {
    id: "507f1f77bcf86cd799439033",
    title: "Algorithm Design",
    src: "/api/videos/507f1f77bcf86cd799439033/stream",
    duration: "33:00",
    category: "Programming",
    xpReward: 30,
  },
];
```

### Step 5: Refresh Browser & Play All 3 Videos!

---

## 🔍 How It Works (Architecture)

```
Your Video File (OOPs.mp4)
          ↓
   Upload Script
          ↓
MongoDB GridFS (stores binary data)
MongoDB VideoMetadata (stores title, duration, etc.)
          ↓
Frontend gets Video ID: 507f1f77bcf86cd799439011
          ↓
Requests: GET /api/videos/507f1f77bcf86cd799439011/stream
          ↓
Backend streams video from GridFS
          ↓
HTML5 Video Player receives stream
          ↓
User sees video playing! ▶️
```

---

## ✅ Checklist

- [ ] MongoDB running (mongod or Docker)
- [ ] Backend server running (npm start)
- [ ] Videos in `Videos` folder
- [ ] Ran `node upload-videos.js`
- [ ] Copied Video IDs from console output
- [ ] Updated `Frontend/js/video-metadata.js`
- [ ] Visited videoplayer.html
- [ ] Playing video successfully! 🎉

---

## 🐛 Troubleshooting

### ❌ "Cannot connect to MongoDB"
**Solution:** Start MongoDB
```bash
# Windows: Start MongoDB Compass app or:
docker run -d -p 27017:27017 mongo
```

### ❌ "Video doesn't play"
**Check:**
1. Is backend running? (`npm start` in Backend folder)
2. Is Video ID correct in `video-metadata.js`?
3. Is MongoDB running?

**Test:**
```bash
# Visit this URL to test streaming:
http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream
# Should show video download dialog or start playing
```

### ❌ "Upload script fails with 'Cannot find module'"
**Solution:** Install missing module
```bash
cd Backend
npm install mongoose
```

---

## 📊 View Uploaded Videos in MongoDB

**Using MongoDB Compass:**
1. Connect to `mongodb://localhost:27017`
2. Database: `acadly_videos`
3. Collections:
   - `videos.files` → Shows your video files
   - `videometadatas` → Shows video metadata

**Each entry should have:**
- `_id`: The Video ID
- `title`: Your video title
- `file_id`: Reference to GridFS file
- `duration`: Video length in seconds
- `category`: "Programming" or whatever you set

---

## 🎯 Next Features to Add

After videos are playing:
1. **Add Quiz**: Questions that appear while watching
2. **Track Progress**: Save user's watch position
3. **Achievements**: Award badges for completing videos
4. **Analytics**: View video statistics (views, avg rating)
5. **Search**: Find videos by title or category

---

## 💡 Pro Tips

1. **Test Video Individually**:
   ```bash
   curl http://localhost:3000/api/videos/507f1f77bcf86cd799439011/stream -o test.mp4
   # Should download video file to test.mp4
   ```

2. **Update Metadata After Upload**:
   - Edit videos in MongoDB Compass
   - Add thumbnails, change duration, update ratings

3. **Bulk Upload**:
   - Add all videos to `videosToUpload` array
   - Run script once to upload all

---

**Ready? Let's go! 🚀**

Start with Step 1 above!
