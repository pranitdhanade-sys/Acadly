/**
 * SYNC MANAGER - Live video progress tracking
 * 
 * Handles:
 * - Auto-saving watch progress to localStorage + backend
 * - Resume functionality (load saved timestamps)
 * - XP tracking and display
 * - Continue watching history
 * - Demo/offline fallback
 * 
 * Usage:
 *   const sync = new SyncManager({ userId: 1, pollInterval: 5000 });
 *   await sync.loadUserStats();
 *   await sync.saveWatchProgress(videoId, currentTime);
 *   await sync.markVideoComplete(videoId, watchedSeconds, quizScore);
 */

class SyncManager {
  constructor(options = {}) {
    this.userId = options.userId || 1;
    this.pollInterval = options.pollInterval || 5000; // 5 seconds
    this.backendUrl = options.backendUrl || "";
    this.enableLogging = options.enableLogging !== false;

    // Local state
    this.userStats = {
      xp_total: 0,
      level: 1,
      completed_videos: 0,
      total_videos: 0,
    };

    this.continueWatching = [];
    this.currentVideoProgress = {};

    // Callbacks for live updates
    this.onXPChange = options.onXPChange || (() => {});
    this.onProgressUpdate = options.onProgressUpdate || (() => {});
    this.onVideoComplete = options.onVideoComplete || (() => {});

    this.log("SyncManager initialized", { userId: this.userId });
  }

  log(...args) {
    if (this.enableLogging) {
      console.log("[SyncManager]", ...args);
    }
  }

  // Get stored value from localStorage or backend
  async loadUserStats() {
    try {
      // Try backend first
      const response = await fetch(
        `${this.backendUrl}/api/progress/user-stats?userId=${this.userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          this.userStats = {
            xp_total: data.profile.xp_total || 0,
            level: data.profile.level || 1,
            completed_videos: data.stats.completed_videos || 0,
            total_videos: data.stats.total_videos || 0,
          };
          // Save to localStorage as backup
          localStorage.setItem(
            `acadly_user_stats_${this.userId}`,
            JSON.stringify(this.userStats)
          );
          this.log("User stats loaded from backend", this.userStats);
          return this.userStats;
        }
      }
    } catch (err) {
      this.log("Backend fetch failed, trying localStorage", err.message);
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(`acadly_user_stats_${this.userId}`);
    if (cached) {
      this.userStats = JSON.parse(cached);
      this.log("User stats loaded from localStorage", this.userStats);
    }

    return this.userStats;
  }

  // Load continue watching list
  async loadContinueWatching() {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/progress/continue-watching?userId=${this.userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          this.continueWatching = data.data || [];
          localStorage.setItem(
            `acadly_continue_${this.userId}`,
            JSON.stringify(this.continueWatching)
          );
          this.log("Continue watching list loaded", this.continueWatching);
          return this.continueWatching;
        }
      }
    } catch (err) {
      this.log("Failed to load continue watching from backend", err.message);
    }

    // Fallback
    const cached = localStorage.getItem(`acadly_continue_${this.userId}`);
    if (cached) {
      this.continueWatching = JSON.parse(cached);
      this.log("Continue watching loaded from localStorage", this.continueWatching);
    }

    return this.continueWatching;
  }

  // Get current progress for a video
  async getVideoProgress(videoId) {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/progress/video-progress?videoId=${videoId}&userId=${this.userId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          this.currentVideoProgress = data.progress;
          // Cache in localStorage
          localStorage.setItem(
            `acadly_video_${this.userId}_${videoId}`,
            JSON.stringify(data.progress)
          );
          this.log(`Video progress loaded for ${videoId}`, data.progress);
          return data.progress;
        }
      }
    } catch (err) {
      this.log(`Failed to load progress for video ${videoId}`, err.message);
    }

    // Fallback
    const cached = localStorage.getItem(
      `acadly_video_${this.userId}_${videoId}`
    );
    if (cached) {
      this.currentVideoProgress = JSON.parse(cached);
      this.log(`Video progress loaded from localStorage`, this.currentVideoProgress);
    }

    return this.currentVideoProgress;
  }

  // Save watch progress (called frequently while watching)
  async saveWatchProgress(videoId, watchSeconds) {
    if (!videoId) return;

    // Save to localStorage immediately (instant)
    const progress = {
      videoId,
      userId: this.userId,
      watchSeconds: Math.round(watchSeconds),
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem(
      `acadly_video_${this.userId}_${videoId}`,
      JSON.stringify(progress)
    );

    // Send to backend (async, don't wait)
    this._sendWatchProgressToBackend(videoId, watchSeconds);

    this.onProgressUpdate({
      videoId,
      watchSeconds: Math.round(watchSeconds),
    });
  }

  // Send watch progress to backend (fire and forget)
  async _sendWatchProgressToBackend(videoId, watchSeconds) {
    try {
      const response = await fetch(`${this.backendUrl}/api/progress/save-watch-time`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          userId: this.userId,
          watchSeconds: Math.round(watchSeconds),
        }),
      });

      if (!response.ok) {
        this.log(`Failed to save watch time for ${videoId}`);
      }
    } catch (err) {
      this.log(`Error saving watch time to backend:`, err.message);
    }
  }

  // Mark video as complete and award XP
  async markVideoComplete(videoId, watchedSeconds, quizScore = 0) {
    if (!videoId) return;

    this.log(`Marking video ${videoId} as complete`);

    try {
      const response = await fetch(
        `${this.backendUrl}/api/progress/video-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            userId: this.userId,
            watchSeconds: Math.round(watchedSeconds),
            quizScore,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          const awardedXp = data.awardedXp || 0;

          // Update local state
          this.userStats.xp_total = (this.userStats.xp_total || 0) + awardedXp;
          this.userStats.completed_videos = (this.userStats.completed_videos || 0) + 1;

          // Persist
          localStorage.setItem(
            `acadly_user_stats_${this.userId}`,
            JSON.stringify(this.userStats)
          );

          this.log(`Video complete! Awarded ${awardedXp} XP`, {
            totalXp: this.userStats.xp_total,
          });

          // Callbacks for UI updates
          this.onXPChange({
            awarded: awardedXp,
            total: this.userStats.xp_total,
          });

          this.onVideoComplete({
            videoId,
            xpAwarded: awardedXp,
            newTotal: this.userStats.xp_total,
          });

          return {
            ok: true,
            awardedXp,
            totalXp: this.userStats.xp_total,
            source: "backend",
          };
        }
      }
    } catch (err) {
      this.log(`Error marking video complete:`, err.message);
    }

    // Offline fallback: award XP locally
    const offlineXp = 25;
    this.userStats.xp_total = (this.userStats.xp_total || 0) + offlineXp;
    this.userStats.completed_videos = (this.userStats.completed_videos || 0) + 1;
    localStorage.setItem(
      `acadly_user_stats_${this.userId}`,
      JSON.stringify(this.userStats)
    );

    this.onXPChange({
      awarded: offlineXp,
      total: this.userStats.xp_total,
    });

    this.onVideoComplete({
      videoId,
      xpAwarded: offlineXp,
      newTotal: this.userStats.xp_total,
    });

    return {
      ok: true,
      awardedXp: offlineXp,
      totalXp: this.userStats.xp_total,
      source: "offline",
    };
  }

  // Get resume timestamp for a video
  async getResumeTimestamp(videoId) {
    const progress = await this.getVideoProgress(videoId);
    return progress.watch_seconds || 0;
  }

  // Format seconds to MM:SS
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}

// Export for use via script tag or module
if (typeof window !== "undefined") {
  window.SyncManager = SyncManager;
}
