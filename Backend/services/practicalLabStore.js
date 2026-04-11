const fs = require('fs');
const path = require('path');

const LABS_DIR = path.join(__dirname, '../labs');

const labsById = new Map();
const sessionsById = new Map();
const leaderboardByUser = new Map();

function loadLabDefinitions() {
  labsById.clear();

  if (!fs.existsSync(LABS_DIR)) {
    return;
  }

  for (const fileName of fs.readdirSync(LABS_DIR)) {
    if (!fileName.endsWith('.json')) continue;
    const absoluteFile = path.join(LABS_DIR, fileName);
    const lab = JSON.parse(fs.readFileSync(absoluteFile, 'utf8'));
    labsById.set(lab.id, { ...lab, sourceFile: fileName });
  }
}

function sanitizeLabDefinition(lab) {
  const { flag, ...safe } = lab;
  return safe;
}

function listLabs() {
  return Array.from(labsById.values()).map(sanitizeLabDefinition);
}

function getLab(id) {
  return labsById.get(id);
}

function saveSession(session) {
  sessionsById.set(session.sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessionsById.get(sessionId);
}

function listUserSessions(userId) {
  const now = Date.now();
  const sessions = Array.from(sessionsById.values()).filter((s) => s.userId === userId);

  return sessions.map((session) => {
    if (session.state === 'running' && now > session.expiresAt) {
      session.state = 'expired';
      session.endedAt = now;
    }
    return session;
  });
}

function incrementAttempt(sessionId) {
  const session = sessionsById.get(sessionId);
  if (!session) return null;

  session.attempts += 1;
  return session;
}

function markCompleted(sessionId, score) {
  const session = sessionsById.get(sessionId);
  if (!session) return null;

  session.state = 'completed';
  session.endedAt = Date.now();
  session.score = score;

  const existing = leaderboardByUser.get(session.userId) || { userId: session.userId, score: 0, solved: 0 };
  existing.score += score;
  existing.solved += 1;
  existing.lastSolvedAt = session.endedAt;
  leaderboardByUser.set(session.userId, existing);

  return session;
}

function markExpired(sessionId) {
  const session = sessionsById.get(sessionId);
  if (!session) return null;
  session.state = 'expired';
  session.endedAt = Date.now();
  return session;
}

function markReset(sessionId, newSessionId) {
  const session = sessionsById.get(sessionId);
  if (!session) return null;
  session.state = 'reset';
  session.endedAt = Date.now();
  session.replacedBy = newSessionId;
  return session;
}

function getLeaderboard(limit = 10) {
  return Array.from(leaderboardByUser.values())
    .sort((a, b) => b.score - a.score || b.solved - a.solved)
    .slice(0, limit);
}

module.exports = {
  loadLabDefinitions,
  listLabs,
  getLab,
  saveSession,
  getSession,
  listUserSessions,
  incrementAttempt,
  markCompleted,
  markExpired,
  markReset,
  getLeaderboard,
};
