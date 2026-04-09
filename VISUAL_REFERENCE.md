# 📊 Live Video Tracking System - Visual Reference Guide

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   USER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Dashboard │  View: dashboard-live.html
└──────┬──────┘
       │
       │ 1. Shows: XP, videos watched, current streak
       │ 2. Loads: Continue watching list from backend
       │ 3. Auto-refreshes: Every 10 seconds
       │ 4. Polls: /api/progress/user-stats
       │
       ├─────────────────────────────────────────────────────┐
       │                                                     │
       v                                                     │
┌─────────────┐                                             │
│ Click Resume│                                             │
└──────┬──────┘                                             │
       │                                                     │
       v                                                     │
┌──────────────────────────┐                                │
│  Open Video Player       │ View: videoplayer-live.html    │
│  videoplayer-live.html   │                                │
└──────┬───────────────────┘                                │
       │                                                     │
       │ 1. Load video metadata                             │
       │ 2. Get saved watch progress from backend           │
       │ 3. Show: "Resumed from 2:30"                       │
       │ 4. Jump player to saved position                   │
       │ 5. Display: Live XP counter                        │
       │                                                     │
       v                                                     │
┌──────────────────────────┐                                │
│   User Watches Video     │                                │
│                          │                                │
│ ⏱️ Every 5 seconds:      │                                │
│ - Save current time      │                                │
│ - Update localStorage    │                                │
│ - Send to backend (async)│                                │
└──────┬───────────────────┘                                │
       │                                                     │
       │ Events:                                            │
       │ • Time updates → Progress bar fills                │
       │ • Seeking → Save new position                      │
       │ • Speed change → Multi-speed support               │
       │                                                     │
       ├───────────────────────────────────────────────────┐│
       │                                                   ││
       v                                                   ││
┌───────────────────────────┐                             ││
│  USER CLOSES PLAYER       │                             ││
│  (with 60% watched)       │                             ││
└──────┬────────────────────┘                             ││
       │                                                   ││
       │ • localStorage saved: "video_xyz: 600 seconds"   ││
       │ • Backend sync: async POST in background         ││
       │ • Status: Incomplete, progess = 60%              ││
       │                                                   ││
       │ ← User closes browser / navigates away           ││
       │                                                   ││
       │ LATER: User returns                              ││
       │ ↓                                                 ││
       │ Dashboard shows "Continue Watching"              ││
       │ ↓                                                 ││
       │ Click Resume                                      ││
       │ ↓                                                 ││
       │ Video loads at 60% (600 seconds)                 ││
       │                                                   ││
       └──────────────────────────────────────────────────┤│
                                                           ││
       SCENARIO 2: User Finishes Video                    ││
       v                                                   ││
┌──────────────────────────┐                             ││
│  VIDEO ENDS (at 100%)    │                             ││
│  on:ended event          │                             ││
└──────┬───────────────────┘                             ││
       │                                                   ││
       │ Call: sync.markVideoComplete()                   ││
       │                                                   ││
       v                                                   ││
┌──────────────────────────┐                             ││
│ POST /api/progress/      │                             ││
│         video-complete   │                             ││
│                          │                             ││
│ Send:                    │                             ││
│ - videoId                │                             ││
│ - userId                 │                             ││
│ - watchSeconds           │                             ││
│ - quizScore (optional)   │                             ││
└──────┬───────────────────┘                             ││
       │                                                   ││
       v                                                   ││
┌────────────────────────────┐                           ││
│  DATABASE UPDATE            │                           ││
│                             │                           ││
│ INSERT/UPDATE:              │                           ││
│ - completed = 1             │                           ││
│ - xp_awarded = 25           │                           ││
│ - last_watched = NOW()      │                           ││
│                             │                           ││
│ UPDATE user_profiles:       │                           ││
│ - xp_total += 25            │                           ││
│ - last_active = TODAY()     │                           ││
└──────┬──────────────────────┘                           ││
       │                                                   ││
       v                                                   ││
┌────────────────────────────┐                           ││
│ RETURN XP AWARDED (25)      │ Response sent back        ││
│                             │ to frontend               ││
│ Frontend receives:          │                           ││
│ { awardedXp: 25,           │                           ││
│   totalXp: 100,            │                           ││
│   source: "database" }     │                           ││
└──────┬──────────────────────┘                           ││
       │                                                   ││
       v                                                   ││
┌────────────────────────────┐                           ││
│ UPDATE LOCAL STATE           │                           ││
│ UI Updates:                 │                           ││
│ 1. Show celebration banner  │ 🎉                        ││
│ 2. Display "+25 XP"         │                           ││
│ 3. XP counter jumps to 100  │                           ││
│ 4. Update stats             │                           ││
│ 5. Remove from continue     │                           ││
│    watching list            │                           ││
└──────┬──────────────────────┘                           ││
       │                                                   ││
       v                                                   ││
┌────────────────────────────┐                           ││
│ USER SEES RESULTS           │                           ││
│                             │                           ││
│ On Screen:                  │                           ││
│ ✅ "Video Complete!"        │                           ││
│ ⭐ "+25 XP"                 │                           ││
│ 📊 "Total XP: 100"          │                           ││
│ [Next Video →] button       │                           ││
│                             │                           ││
│ Optional: Auto-load next   │                           ││
│ video from playlist         │                           ││
└────────┬───────────────────┘                           ││
         │                                                 ││
         │ Return to Dashboard                           ││
         │ (polling syncs automatically)                 ││
         │                                                 ││
         └──────────────────────────────────────────────→├┘
                                                          │
                                                          │ Update every 10s
                                                          │
                                                          v
                                        ┌──────────────────────────┐
                                        │ Dashboard Updates Live   │
                                        │                          │
                                        │ GET /api/progress/       │
                                        │  user-stats              │
                                        │                          │
                                        │ Shows:                   │
                                        │ • XP: 100               │
                                        │ • Level: 1              │
                                        │ • Videos: 1             │
                                        │ • Continue Watching: 2  │
                                        │ • Activity: "Earned 25"  │
                                        │                          │
                                        │ No page refresh needed!  │
                                        └──────────────────────────┘
```

---

## Data Storage Strategy

```
┌─────────────────────────────────────────────────────┐
│            VIDEO PROGRESS STORAGE                   │
└─────────────────────────────────────────────────────┘

Scenario: User watches video for 450 seconds (7.5 min)

┌─────────────────────────────────────────────────────┐
│                   BROWSER (Client)                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  localStorage (Instant Write ≈1ms)                │
│  ┌─────────────────────────────────────────────┐   │
│  │ Key: acadly_video_1_video_oops_001         │   │
│  │ Value: {                                    │   │
│  │   videoId: "video_oops_001",               │   │
│  │   userId: 1,                               │   │
│  │   watchSeconds: 450,                       │   │
│  │   lastSaved: "2026-04-08T15:30:00Z"       │   │
│  │ }                                           │   │
│  └─────────────────────────────────────────────┘   │
│                    ↑                                │
│          Survives page close!                      │
│          Works offline!                            │
│                                                     │
│  (Every 5 seconds during video playback)           │
│  localStorage.setItem(key, JSON.stringify(data))   │
│                                                     │
└─────────────────────────────────────────────────────┘
                    ↓↓↓
        Async fetch (non-blocking)
                    ↓↓↓
┌─────────────────────────────────────────────────────┐
│                BACKEND (Server)                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  POST /api/progress/save-watch-time               │
│  ┌─────────────────────────────────────────────┐   │
│  │ {                                            │   │
│  │   videoId: "video_oops_001",                │   │
│  │   userId: 1,                                 │   │
│  │   watchSeconds: 450                          │   │
│  │ }                                            │   │
│  └─────────────────────────────────────────────┘   │
│              ↓ Validates ↓                         │
│              ↓ Converts ↓                          │
│         ↓ Sends to MySQL ↓                         │
│                                                     │
└─────────────────────────────────────────────────────┘
                    ↓↓↓
┌─────────────────────────────────────────────────────┐
│               MYSQL DATABASE                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  INSERT INTO user_video_progress                   │
│  (user_id, video_id, watch_seconds, completed)    │
│  VALUES (1, "video_oops_001", 450, 0)             │
│                                                     │
│  ON DUPLICATE KEY UPDATE                           │
│  watch_seconds = 450,                              │
│  last_watched = CURRENT_TIMESTAMP                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Result: Row updated with latest progress   │   │
│  │ ✅ Persistent                               │   │
│  │ ✅ Survives page close                      │   │
│  │ ✅ Survives browser crash                   │   │
│  │ ✅ Survives device restart                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Data is ALSO available to:                        │
│  - Other devices (same user ID)                    │
│  - Dashboard queries                               │
│  - Analytics & reports                             │
│                                                     │
└─────────────────────────────────────────────────────┘


BACKUP STRATEGY:
╔═════════════════════════════════════════════════════╗
║  localStorage        MySQL                        ║
║  (Fast, Instant)     (Persistent, Shared)        ║
║                                                    ║
║  ✅ Video plays      ✅ Data survives crashes    ║
║  ✅ Works offline    ✅ Multi-device sync        ║
║  ✅ Instant resume   ✅ Historical tracking      ║
║                                                    ║
║  If frontend cache   If backend down:            ║
║  is corrupted:       Resume from localStorage     ║
║  Reload from user-stats API when online          ║
╚═════════════════════════════════════════════════════╝
```

---

## Real-Time Update Flow

```
┌────────────────────────────────────────────────────────┐
│         HOW LIVE UPDATES WORK                          │
│  (Without WebSockets, just polling)                    │
└────────────────────────────────────────────────────────┘


Timeline (User watching videos):

T=0:00
├─ [Dashboard] Loads → Fetches stats → Shows XP: 0
│
T=0:05
├─ [Player] Auto-saves: "120 seconds watched"
│  └─ localStorage updated instantly
│  └─ backend.saveWatchProgress() sent async
│
T=0:10
├─ [Dashboard] Polling tick #1
│  └─ GET /api/progress/user-stats
│  └─ Stats unchanged (video not complete yet)
│
T=1:00
├─ [Player] Auto-continue saving
│  └─ Watch seconds: 600 (10 minutes)
│  └─ Backend updated in background
│
T=2:00 ⭐ USER COMPLETES VIDEO
├─ [Player] Video ends
│  ├─ POST /api/progress/video-complete
│  ├─ Server: Award 25 XP
│  ├─ Server: UPDATE user_profiles.xp_total
│  ├─ localStorage updated immediately
│  ├─ Show: 🎉 +25 XP banner
│  └─ XP Counter: 0 → 25 (instant!)
│
T=2:05
├─ [Dashboard] Still polling (doesn't know about XP yet)
│  └─ GET /api/progress/user-stats
│  └─ Server returns: xp_total: 25
│  └─ Dashboard updates WITHOUT refresh! ✨
│  └─ Shows: "XP: 0 → 25" (animated)
│
T=2:10
├─ [Dashboard] Next refresh
│  └─ Notices video moved to completed
│  └─ Removes from "Continue Watching"
│

Result:
┌─ Player: Updates immediately (XP shown)
├─ localStorage: Updated immediately  
├─ Dashboard: Updated within 5s (polling)
└─ Database: Already saved (persistent)

User sees everything "live" without refresh!
```

---

## Component Communication

```
┌──────────────────────────────────────────────────────┐
│  COMPONENT ARCHITECTURE                              │
└──────────────────────────────────────────────────────┘


    ┌──────────────────────────────────────────────┐
    │  videoplayer-live.html                       │
    │  (Video Player Component)                    │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Events:                                     │
    │  ├─ timeupdate ──→ Update progress bar     │
    │  ├─ play ──→ Resume playback               │
    │  ├─ pause ──→ Save progress                │
    │  ├─ seeking ──→ Save new position          │
    │  └─ ended ──→ Mark complete & award XP     │
    │                                              │
    │  Uses: SyncManager API                       │
    │  ├─ sync.getVideoProgress(videoId)          │
    │  ├─ sync.saveWatchProgress(...)             │
    │  ├─ sync.markVideoComplete(...)             │
    │  └─ sync.loadContinueWatching()             │
    │                                              │
    │  Updates UI:                                 │
    │  ├─ Progress bar                            │
    │  ├─ Time display                            │
    │  ├─ XP counter (via callback)               │
    │  └─ Completion banner                       │
    │                                              │
    └──┬───────────────────────────────────────────┘
       │ onXPChange callback
       │ onVideoComplete callback
       │ onProgressUpdate callback
       │
       ▼
    ┌──────────────────────────────────────────────┐
    │  sync-manager.js                             │
    │  (Core Sync Logic)                           │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Methods:                                    │
    │  ├─ loadUserStats()                         │
    │  ├─ loadContinueWatching()                  │
    │  ├─ getVideoProgress(videoId)               │
    │  ├─ saveWatchProgress(videoId, seconds)    │
    │  ├─ markVideoComplete(videoId)              │
    │  └─ getResumeTimestamp(videoId)             │
    │                                              │
    │  Storage:                                    │
    │  ├─ Try: fetch() → backend API              │
    │  ├─ Fallback: localStorage                  │
    │  └─ Callbacks: Fire XP/progress events      │
    │                                              │
    │  Properties:                                 │
    │  ├─ userStats { xp_total, level, ... }     │
    │  ├─ continueWatching []                     │
    │  └─ currentVideoProgress {}                 │
    │                                              │
    └──┬───────────────────────────────────────────┘
       │ fetch('/api/progress/...')
       │ JSON requests/responses
       │ Auto-sync every 5s
       │
       ▼
    ┌──────────────────────────────────────────────┐
    │  Backend API (Node.js Express)               │
    │  Backend/routes/progress.js                  │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Endpoints:                                  │
    │  ├─ POST /api/progress/save-watch-time      │
    │  ├─ POST /api/progress/video-complete       │
    │  ├─ GET /api/progress/continue-watching    │
    │  ├─ GET /api/progress/user-stats           │
    │  └─ GET /api/progress/video-progress       │
    │                                              │
    │  Logic:                                      │
    │  ├─ Validate inputs                         │
    │  ├─ Query/update database                   │
    │  ├─ Calculate XP awards                     │
    │  └─ Handle offline gracefully               │
    │                                              │
    └──┬───────────────────────────────────────────┘
       │ SQL queries
       │ Database transactions
       │ ACID compliance
       │
       ▼
    ┌──────────────────────────────────────────────┐
    │  MySQL Database                              │
    │  user_video_progress                         │
    │  user_profiles                               │
    ├──────────────────────────────────────────────┤
    │  Persistent Storage                          │
    │  Multi-user data                             │
    │  Atomic transactions                         │
    └──────────────────────────────────────────────┘


    ┌──────────────────────────────────────────────┐
    │  dashboard-live.html                         │
    │  (Dashboard Component)                       │
    ├──────────────────────────────────────────────┤
    │                                              │
    │  Polling (every 10 seconds):                 │
    │  await sync.loadUserStats()                  │
    │  await sync.loadContinueWatching()           │
    │                                              │
    │  Displays:                                   │
    │  ├─ Live XP counter                         │
    │  ├─ Videos watched count                    │
    │  ├─ Current level                           │
    │  ├─ Streak days                             │
    │  ├─ Continue watching cards                 │
    │  ├─ Activity feed                           │
    │  └─ Learning path progress                  │
    │                                              │
    │  Updates: Without page refresh!              │
    │  └─ Animation on XP change                   │
    │                                              │
    └──────────────────────────────────────────────┘


All components talk through:
✓ HTTP REST API (synchronous)
✓ Callbacks (event-driven)
✓ Shared localStorage (local state)
✓ MySQL (source of truth)
```

---

## Summary: What Actually Happens

### Scenario 1: Watch 90 seconds, close

```
T=0:00  Start watching
        └─ Player loads, currentTime = 0

T=0:05  After 5 seconds
        ├─ localStorage.setItem("acadly_video_1_xyz", {..., seconds: 5})
        └─ fetch POST /api/progress/save-watch-time (async)

T=0:10  After 10 seconds
        ├─ localStorage updated: seconds: 10
        └─ Backend request still in flight from T=0:05

T=0:15  After 15 seconds
        ├─ localStorage updated: seconds: 15
        ├─ Backend response received from T=0:05 request
        └─ fetch POST /api/progress/save-watch-time (new async)

... repeats every 5 seconds ...

T=1:30  After 90 seconds, USER CLOSES PLAYER
        ├─ localStorage shows: seconds: 90
        ├─ Backend has latest update (async in flight)
        └─ Both have data!

NEXT DAY: User opens dashboard
        ├─ GET /api/progress/continue-watching
        ├─ Backend returns: watch_seconds: 90, completed: 0
        ├─ Dashboard shows: "📍 1:30 watched"
        └─ User clicks Resume

Player opens, resume logic:
        ├─ Get video progress from backend
        ├─ Load: watch_seconds: 90
        ├─ Set: player.currentTime = 90
        ├─ User sees: "⏱️ Resumed from 1:30"
        └─ Video jumps to 90 second mark ✅
```

### Scenario 2: Complete video (full watch)

```
T=0:00  Start watching
T=0:05  Auto-save: 5s → localStorage + backend
T=0:10  Auto-save: 10s → localStorage + backend
...
T=20:00 VIDEO ENDS (assuming 20 min video)
        ├─ on:ended event fires
        ├─ Call: sync.markVideoComplete("video_xyz", 1200)
        ├─ POST /api/progress/video-complete
        │  ├─ Server updates: completed = 1
        │  ├─ Server adds: xp_awarded = 25
        │  ├─ Server updates: user_profiles.xp_total += 25
        │  └─ Returns: {ok: true, awardedXp: 25}
        ├─ Frontend receives response
        ├─ Show: 🎉 "Video Complete!" banner
        ├─ Show: "+25 XP" animation
        ├─ Update: XP counter: 0 → 25
        ├─ Update: localStorage (stats)
        └─ localStorage: user_stats.completed_videos += 1

T=20:00 Dashboard is polling
        ├─ Still has old data from 10s polling
        └─ Doesn't know about XP yet

T=20:05 Dashboard polling tick
        ├─ GET /api/progress/user-stats
        ├─ Backend returns: xp_total: 25
        ├─ Dashboard updates:
        │  ├─ XP display: 0 → 25
        │  ├─ Videos watched: 0 → 1
        │  ├─ Activity feed: "Earned 25 XP"
        │  └─ Continue watching: video removed
        └─ All WITHOUT page refresh! ✨

Result:
    Player: Instant feedback (banner + XP)
    Dashboard: Live update within 5 seconds
    Database: Persistent, synced
    User: Feels like "real-time" 🚀
```

---

## File Structure After Implementation

```
Acadly02-main/
├── Backend/
│   └── routes/
│       └── progress.js                    [MODIFIED - 5 endpoints]
│
├── Frontend/
│   ├── js/
│   │   ├── sync-manager.js               [NEW - 172 lines]
│   │   ├── video-metadata.js              (unchanged)
│   │   └── videoplayer.html               (unchanged)
│   │
│   ├── videoplayer-live.html             [NEW - 550+ lines]
│   ├── dashboard-live.html               [NEW - 450+ lines]
│   ├── videoplayer.html                  (old version, still works)
│   ├── dashboard.html                    (old version, still works)
│   └── ...other files
│
├── DataBase/
│   ├── schema.sql                         (NO CHANGES NEEDED)
│   ├── db_config.js                       (NO CHANGES)
│   └── ...other files
│
├── QUICK_START_LIVE_TRACKING.md          [NEW]
├── LIVE_TRACKING_SETUP.md                [NEW]
├── TECHNICAL_SUMMARY.md                  [NEW]
└── ... other project files
```

---

This visual guide should help you understand exactly how the system works from end-to-end! 🎯
