const express = require('express');
const {
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
} = require('../services/practicalLabStore');
const { provisionEnvironment, destroyEnvironment } = require('../services/environmentProvider');

const router = express.Router();

loadLabDefinitions();

function readUserId(req) {
  return (
    req.header('x-user-id') ||
    req.query.userId ||
    req.body?.userId ||
    'anonymous'
  ).toString();
}

function buildSession(lab, userId, runtimeContext) {
  const now = Date.now();
  const timeoutMs = (lab.timeoutMinutes || 45) * 60 * 1000;
  const sessionId = `lab-${now}-${Math.floor(Math.random() * 9999)}`;

  return {
    sessionId,
    userId,
    labId: lab.id,
    state: 'running',
    attempts: 0,
    maxAttempts: lab.maxAttempts || 5,
    startedAt: now,
    expiresAt: now + timeoutMs,
    runtimeContext,
    hintLevelUnlocked: 0,
  };
}

function scoreSession(lab, session) {
  const maxScore = 1000;
  const elapsedMinutes = Math.max(1, Math.ceil((Date.now() - session.startedAt) / 60000));
  const attemptPenalty = session.attempts * 40;
  const timePenalty = elapsedMinutes * 5;
  const difficultyMultiplier = lab.difficulty === 'hard' ? 1.2 : lab.difficulty === 'easy' ? 0.9 : 1;
  return Math.max(50, Math.floor((maxScore - attemptPenalty - timePenalty) * difficultyMultiplier));
}

router.get('/labs', (req, res) => {
  const labs = listLabs();
  res.json({ count: labs.length, labs });
});

router.get('/labs/:labId', (req, res) => {
  const lab = getLab(req.params.labId);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found.' });
  }
  return res.json({ lab: { ...lab, flag: undefined } });
});

router.post('/labs/:labId/launch', async (req, res) => {
  const userId = readUserId(req);
  const lab = getLab(req.params.labId);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found.' });
  }

  const runtimeContext = await provisionEnvironment(lab, `${Date.now()}`);
  const session = buildSession(lab, userId, runtimeContext);
  saveSession(session);

  setTimeout(async () => {
    const latest = getSession(session.sessionId);
    if (latest && latest.state === 'running' && Date.now() >= latest.expiresAt) {
      markExpired(session.sessionId);
      await destroyEnvironment(latest);
    }
  }, Math.max(1000, session.expiresAt - Date.now()));

  return res.status(201).json({
    message: 'Lab launched.',
    session,
    terminal: {
      protocol: 'websocket',
      shellToken: `ws-${session.sessionId}`,
      shellCommand: runtimeContext.shell,
    },
    objective: {
      problemStatement: lab.problemStatement,
      objective: lab.objective,
    },
  });
});

router.get('/sessions', (req, res) => {
  const userId = readUserId(req);
  const sessions = listUserSessions(userId);
  return res.json({ count: sessions.length, sessions });
});

router.get('/sessions/:sessionId', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }
  return res.json({ session });
});

router.post('/sessions/:sessionId/submit-flag', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  if (session.state !== 'running') {
    return res.status(400).json({ error: `Session is ${session.state}, flag submission is closed.` });
  }

  const lab = getLab(session.labId);
  const submittedFlag = (req.body?.flag || '').toString().trim();

  incrementAttempt(session.sessionId);
  if (submittedFlag === lab.flag) {
    const score = scoreSession(lab, session);
    markCompleted(session.sessionId, score);
    return res.json({ correct: true, score, message: 'Flag accepted. Lab completed.' });
  }

  if (session.attempts >= session.maxAttempts) {
    markExpired(session.sessionId);
    return res.status(429).json({
      correct: false,
      message: 'Max attempts reached. Session expired.',
      attempts: session.attempts,
    });
  }

  return res.status(400).json({
    correct: false,
    message: 'Incorrect flag.',
    attempts: session.attempts,
    attemptsLeft: session.maxAttempts - session.attempts,
  });
});

router.post('/sessions/:sessionId/hints/unlock', (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const lab = getLab(session.labId);
  if (!lab) {
    return res.status(404).json({ error: 'Lab not found for session.' });
  }

  const currentLevel = session.hintLevelUnlocked || 0;
  if (currentLevel >= lab.hints.length) {
    return res.json({ unlocked: lab.hints.length, hint: null, message: 'All hints already unlocked.' });
  }

  session.hintLevelUnlocked = currentLevel + 1;
  return res.json({
    unlocked: session.hintLevelUnlocked,
    hint: lab.hints[currentLevel],
    nextStep: lab.guide[currentLevel] || null,
  });
});

router.post('/sessions/:sessionId/reset', async (req, res) => {
  const current = getSession(req.params.sessionId);
  if (!current) {
    return res.status(404).json({ error: 'Session not found.' });
  }

  const lab = getLab(current.labId);
  await destroyEnvironment(current);

  const runtimeContext = await provisionEnvironment(lab, `${Date.now()}`);
  const newSession = buildSession(lab, current.userId, runtimeContext);
  saveSession(newSession);
  markReset(current.sessionId, newSession.sessionId);

  return res.json({
    message: 'Lab reset complete.',
    previousSessionId: current.sessionId,
    newSession,
  });
});

router.get('/leaderboard', (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  const leaderboard = getLeaderboard(limit);
  return res.json({ count: leaderboard.length, leaderboard });
});

module.exports = router;
