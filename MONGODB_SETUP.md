# 🗄️ MongoDB Setup Guide - 5 Minutes

## Two Options:

### Option 1: MongoDB Atlas (Cloud) - EASIEST ⭐ RECOMMENDED

**Completely free and instant!**

#### Step 1: Create Free MongoDB Atlas Account
1. Visit: https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with Email (or Google/GitHub)
4. Verify email

#### Step 2: Create Free Cluster
1. After login, click "Create" → "Build a Cluster"
2. Choose:
   - **Provider:** AWS
   - **Region:** N. Virginia (closest to you)
   - **Cluster Tier:** M0 (Free)
3. Click "Create Cluster" (wait ~3 minutes)

#### Step 3: Create Database User
1. Go to "Security" → "Database Access"
2. Click "Add New Database User"
3. Create user:
   - **Username:** acadly_admin
   - **Password:** AcadlyAdmin123!
   - **Role:** Atlas Admin
4. Click "Add User"

#### Step 4: Whitelist Your IP
1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

#### Step 5: Get Connection String
1. Click "Connect" on cluster
2. Choose "Connect your application"
3. Select "Node.js" and version "4.x or higher"
4. Copy connection string
5. Replace:
   - `<username>` → acadly_admin
   - `<password>` → AcadlyAdmin123!
   - `<dbname>` → acadly_videos

**Example:**
```
mongodb+srv://acadly_admin:AcadlyAdmin123!@cluster0.xxxxx.mongodb.net/acadly_videos?retryWrites=true&w=majority
```

#### Step 6: Update .env File
Edit: `.env`

Replace line 25:
```
MONGO_URI=mongodb+srv://acadly_admin:AcadlyAdmin123!@cluster0.xxxxx.mongodb.net/acadly_videos?retryWrites=true&w=majority
```

#### Step 7: Upload Videos!
```bash
cd Backend
node upload-videos.js
```

---

### Option 2: Local MongoDB (Windows)

#### Using MongoDB Installer:
1. Download: https://www.mongodb.com/try/download/community
2. Run installer → Next → Next → Install
3. MongoDB service starts automatically
4. Default connection: `mongodb://localhost:27017`

#### Or Using Chocolatey:
```powershell
choco install mongodb -y
mongod  # Start MongoDB in terminal
```

#### Or Using WSL2 + Docker:
```bash
wsl --install
docker run -d -p 27017:27017 --name mongodb mongo
```

---

## ✅ Verify Connection

After updating .env:

```bash
cd Backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log('✅ MongoDB Connected!'); process.exit(0); })
  .catch(e => { console.log('❌ Error:', e.message); process.exit(1); })
"
```

---

## 🚀 Quick Start After Setup

```bash
cd Backend
node upload-videos.js
```

Done! Your videos are uploading to MongoDB! 🎉
