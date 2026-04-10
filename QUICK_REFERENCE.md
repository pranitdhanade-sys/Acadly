# 📋 LIVE VIDEO TRACKING SYSTEM - QUICK REFERENCE CARD

## 🚀 START HERE (Copy-Paste Commands)

### 1. Start Backend
```bash
cd Backend
npm start
```
✅ Should see: "Server running on port 3000"

### 2. Test URLs
```
Dashboard:  http://localhost:3000/dashboard-live.html
Player:     http://localhost:3000/videoplayer-live.html
```

### 3. Test API (in new terminal)
```bash
# Check if backend is responding
curl http://localhost:3000/api/progress/user-stats?userId=1

# Should return JSON with xp_total, level, etc.
```

---

## 📁 What Was Built (5 Files)

| File | Purpose | Lines |
|------|---------|-------|
| `Backend/routes/progress.js` | 5 new API endpoints | +150 |
| `Frontend/js/sync-manager.js` | Core sync logic | 172 |
| `Frontend/videoplayer-live.html` | Enhanced player | 550+ |
| `Frontend/dashboard-live.html` | Live dashboard | 450+ |
| Docs | Setup guides | 2000+ |

**Total: ~1,300 lines of new code**

---

## ⭐ Key Features

```
✅ Auto-Resume        Watch video → Save position → Resume later
✅ Live XP            +25 XP instantly shown when video completes  
✅ Continue Watching  Dashboard shows incomplete videos
✅ Auto-Save          Every 5 seconds to localStorage + backend
✅ Offline Support    Works without internet (localStorage backup)
✅ Live Dashboard     Polls every 10s, updates without refresh
✅ No Setup           Uses existing database, no migrations
```

---

## 🎯 How It Works (Simple)

```
User watches video (30 sec)
    ↓
Auto-saves: localStorage + backend (every 5s)
    ↓
User closes player
    ↓
Dashboard loads → Shows "Continue Watching"
    ↓
User clicks Resume
    ↓
Video jumps to 30-second mark ✅
    ↓
User finishes video
    ↓
+25 XP awarded → Dashboard updates live ✅
```

---

## 🔧 API Endpoints (New)

```bash
# Save watch progress (called automatically every 5s)
POST /api/progress/save-watch-time
{videoId, userId, watchSeconds}

# Mark video complete & award XP
POST /api/progress/video-complete
{videoId, userId, watchSeconds}

# Get user's continue watching list
GET /api/progress/continue-watching?userId=1

# Get user's stats (XP, videos, level)
GET /api/progress/user-stats?userId=1

# Get specific video progress
GET /api/progress/video-progress?videoId=x&userId=1
```

---

## 📊 Database Tables (Existing - No Changes)

```sql
user_video_progress
├─ watch_seconds (auto-updated every 5s)
├─ completed (0=unfinished, 1=done)
└─ xp_awarded (25 per video)

user_profiles
├─ xp_total (incremented on video complete)
├─ level (calculated from XP)
└─ streak_days
```

---

## 🎮 Usage Examples

### For End Users (Students)
1. Go to `dashboard-live.html`
2. Click "Resume" on video in "Continue Watching"
3. Video plays from saved position
4. Complete video → See +25 XP
5. Dashboard updates automatically (no refresh!)

### For Developers
```javascript
// Create sync manager
const sync = new SyncManager({userId: 1});

// Load data
await sync.loadUserStats();
await sync.loadContinueWatching();

// Auto-called during playback
sync.saveWatchProgress(videoId, currentTime);

// On video end
sync.markVideoComplete(videoId, watchedSeconds);
```

---

## ⚙️ Configuration

### Change XP Per Video
```javascript
// Backend/routes/progress.js, line 5:
const XP_PER_VIDEO = 25;  // ← Change this
```

### Change Auto-Save Interval
```javascript
// videoplayer-live.html, line ~280:
}, 5000);  // ← 5000ms = 5 seconds
```

### Change Dashboard Refresh Rate
```javascript
// dashboard-live.html, line ~200:
setInterval(loadDashboardData, 10000);  // ← milliseconds
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Video doesn't resume | Check `localStorage` in console; restart backend |
| XP not updating | Hard refresh: `Ctrl+Shift+R`; check `npm` logs |
| Page blank | Check console for errors (`F12`); start backend |
| "Continue Watching" empty | Watch video 30+ sec, close, refresh |

---

## ✅ Verification (5-Minute Test)

```bash
# 1. Start backend
cd Backend && npm start

# 2. Open dashboard
http://localhost:3000/dashboard-live.html

# 3. Open video player (new tab)
http://localhost:3000/videoplayer-live.html

# 4. Watch video for 30 seconds

# 5. Close player, go to dashboard

# 6. See "Continue Watching" section?
   YES ✅ System works!
   NO ❌ Check console errors
```

---

## 📚 Documentation Files

```
QUICK_START_LIVE_TRACKING.md
├─ 2-minute setup guide
└─ Basic troubleshooting

LIVE_TRACKING_SETUP.md
├─ Detailed technical guide
├─ All endpoint specs
└─ Advanced customization

TECHNICAL_SUMMARY.md
├─ Architecture & design decisions
├─ Performance benchmarks
└─ Security considerations

VISUAL_REFERENCE.md
├─ System flow diagrams
├─ Data storage strategy
└─ Component communication

VERIFICATION_CHECKLIST.md
├─ Step-by-step testing
├─ API testing examples
└─ Troubleshooting tree
```

---

## 🎯 System Architecture (Bird's Eye View)

```
Browser
  ↓
videoplayer-live.html (plays video)
  ↓
sync-manager.js (auto-save every 5s)
  ├─ localStorage (instant)
  └─ backend API (async)
      ↓
  Backend/routes/progress.js
      ↓
  MySQL Database
  ↓
dashboard-live.html (polls every 10s)
  ↓
Shows live updates WITHOUT refresh ✨
```

---

## 📦 File Locations

```
/Backend/routes/progress.js           ← Enhanced endpoints
/Frontend/js/sync-manager.js          ← Core logic (NEW)
/Frontend/videoplayer-live.html       ← Player (NEW)
/Frontend/dashboard-live.html         ← Dashboard (NEW)

Old files still work:
/Frontend/videoplayer.html            ← Original (unchanged)
/Frontend/dashboard.html              ← Original (unchanged)
```

---

## 🚨 Error Messages & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot fetch/api/progress...` | Backend not running | `npm start` |
| `localStorage undefined` | Browser security | Use HTTPS or localhost |
| `Cannot read property 'classList'` | HTML element missing | Check element IDs match |
| `xp_total isn't a number` | Database error | Run `setup-db.js` |
| `SQLException` | Table doesn't exist | Run `setup-db.js` |

---

## 💾 Key Data Structures

### User Video Progress (localStorage)
```javascript
{
  videoId: "video_oops_001",
  userId: 1,
  watchSeconds: 450,
  lastSaved: "2026-04-08T15:30:00Z"
}
```

### User Stats (from API)
```javascript
{
  profile: {
    xp_total: 75,
    level: 1,
    streak_days: 3
  },
  stats: {
    total_videos: 5,
    completed_videos: 3,
    total_xp_earned: 75
  }
}
```

---

## 🎯 Success Checklist

- [ ] Backend starts without errors
- [ ] Dashboard page loads
- [ ] Video player page loads
- [ ] Can play video for 30+ seconds
- [ ] Dashboard shows "Continue Watching" after closing
- [ ] Resume works (video jumps to saved position)
- [ ] Completing video shows celebration + XP
- [ ] Dashboard updates live (no manual refresh)

**All checked? → Ready for hackathon! 🚀**

---

## 📞 Quick Commands Reference

```bash
# Backend
npm start                    # Start server

# Database
mysql -u root acadly_db    # Connect to DB
node Backend/setup-db.js   # Initialize DB

# Testing
curl http://localhost:3000/api/progress/user-stats?userId=1

# Browser Dev Tools (F12)
localStorage.getItem('acadly_video_1_video_oops_001')
Object.keys(localStorage).filter(k => k.includes('acadly'))
```

---

## 🎓 Learning Path (Next Steps)

1. **Get it working** (this checklist)
2. **Understand it** (read TECHNICAL_SUMMARY.md)
3. **Customize it** (adjust XP, intervals, etc.)
4. **Extend it** (add quizzes, badges, leaderboard)
5. **Deploy it** (production security setup)

---

## 🎉 You're All Set!

**One command to test everything:**
```bash
cd Backend && npm start &
open http://localhost:3000/dashboard-live.html
open http://localhost:3000/videoplayer-live.html
# Watch video → Close → Refresh dashboard → See "Continue Watching" ✅
```

---

## 📝 Notes for Presentation

```
"We built a fully dynamic video learning platform that:

✅ Auto-saves where you left off (resume feature)
✅ Tracks XP in real-time
✅ Shows live dashboard with no page refreshes
✅ Works offline with localStorage
✅ Syncs to database automatically

Built with: Node.js backend + Vanilla JS frontend + MySQL
No complex frameworks needed!
All done in ~1,300 lines of clean, documented code."
```

---

**🎯 Ready? Open your browser and test it now!**

`http://localhost:3000/dashboard-live.html`

*Questions? Check TECHNICAL_SUMMARY.md or VERIFICATION_CHECKLIST.md*

---

Version 1.0 | April 8, 2026 | Acadly Live Tracking System
