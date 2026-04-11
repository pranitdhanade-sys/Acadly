const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { loadQuestionBank } = require("../modules/practice-lab/question-loader");
const { generateTest } = require("../modules/practice-lab/test-generator");
const { evaluateTestSubmission } = require("../modules/practice-lab/evaluator");
const { recordAttempt, getHistory, getAnalytics } = require("../modules/practice-lab/history-store");
const { nextDifficultyFromPerformance } = require("../modules/practice-lab/adaptive-engine");

const router = express.Router();
const FRONTEND_PATH = path.join(__dirname, "../../Frontend");
const QUESTION_LIBRARY_PATH = path.join(__dirname, "../questions");

const QUESTION_BASE_CANDIDATES = [
  path.join(__dirname, "../../Questions/Subject"),
  path.join(__dirname, "../../questions/Subject"),
];

const MACHINE_CATALOG = [
  {
    id: "docker-escape-ctf",
    name: "Docker Escape Room",
    track: "docker",
    difficulty: "medium",
    points: 150,
    solveRate: "47%",
    duration: "45 min",
    tags: ["containers", "privilege", "filesystem"],
    description: "Investigate an over-privileged container and capture the flag from host artifacts.",
    objectives: [
      "Enumerate container capabilities and mounts",
      "Identify host filesystem exposure",
      "Extract and submit PTL flag",
    ],
    answer: "PTL{docker_escape_complete}",
  },
  {
    id: "docker-supply-chain-ctf",
    name: "Docker Supply Chain Hunt",
    track: "docker",
    difficulty: "hard",
    points: 220,
    solveRate: "31%",
    duration: "60 min",
    tags: ["image", "registry", "secrets"],
    description: "Trace a poisoned image layer and recover leaked build-time credentials.",
    objectives: [
      "Inspect image history and suspicious layers",
      "Recover secret from stale layer",
      "Find hidden flag artifact",
    ],
    answer: "PTL{layer_forensics_win}",
  },
  {
    id: "k8s-rbac-breakout-ctf",
    name: "Kubernetes RBAC Breakout",
    track: "kubernetes",
    difficulty: "medium",
    points: 180,
    solveRate: "42%",
    duration: "55 min",
    tags: ["rbac", "serviceaccount", "api"],
    description: "Abuse weak RBAC bindings to reach a protected namespace and capture a flag.",
    objectives: [
      "Enumerate service account permissions",
      "Pivot into restricted namespace",
      "Read flag secret",
    ],
    answer: "PTL{k8s_rbac_pwned}",
  },
  {
    id: "k8s-network-policy-ctf",
    name: "Kubernetes Network Policy Maze",
    track: "kubernetes",
    difficulty: "hard",
    points: 240,
    solveRate: "28%",
    duration: "70 min",
    tags: ["networkpolicy", "dns", "lateral-move"],
    description: "Bypass restrictive policies through namespace and DNS misconfiguration.",
    objectives: [
      "Map namespace egress constraints",
      "Exploit policy gaps",
      "Retrieve PTL flag from internal service",
    ],
    answer: "PTL{netpol_maze_cleared}",
  },
];

const activeInstances = new Map();
const activeTests = new Map();

const normalize = (value = "") => value.toString().trim();
const normalizeText = (value = "") => normalize(value).toLowerCase();

function resolveQuestionBasePath() {
  return QUESTION_BASE_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function safeReadJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
  } catch (error) {
    console.warn(`Failed to parse question file: ${filePath}`, error.message);
  }
  return [];
}

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

router.get("/practicelab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicelab.html"));
});

router.get("/practicallab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicallab.html"));
});

router.post("/api/start-lab", (req, res) => {
  const subject = normalize(req.body?.subject || "Physics");
  const topic = normalize(req.body?.topic || "All Topics");
  const difficulty = normalizeText(req.body?.difficulty || "medium");
  const requestedCount = Math.max(1, Math.min(50, Number.parseInt(req.body?.questions, 10) || 10));

  const basePath = resolveQuestionBasePath();
  if (!basePath) {
    return res.status(500).json({ error: "Questions directory was not found." });
  }

  const subjectPath = path.join(basePath, subject);
  if (!fs.existsSync(subjectPath)) {
    return res.status(404).json({ error: `Subject not found: ${subject}` });
  }

  let topics = [];
  if (normalizeText(topic) === "all topics") {
    topics = fs
      .readdirSync(subjectPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } else {
    topics = [topic];
  }

  let allQuestions = [];
  for (const topicName of topics) {
    const difficultyFile = path.join(subjectPath, topicName, `${difficulty}.json`);
    const questions = safeReadJsonArray(difficultyFile).map((item) => ({
      ...item,
      subject,
      topic: topicName,
      difficulty,
    }));
    allQuestions = allQuestions.concat(questions);
  }

  if (!allQuestions.length) {
    return res.status(404).json({
      error: `No ${difficulty} questions found for selected subject/topic.`,
      subject,
      topic,
    });
  }

  const generatedQuestions = shuffle(allQuestions).slice(0, requestedCount);
  return res.json({
    message: "Lab started",
    totalAvailable: allQuestions.length,
    generatedCount: generatedQuestions.length,
    questions: generatedQuestions,
  });
});

router.get("/api/practice-lab/questions", (req, res) => {
  const topic = normalizeText(req.query.topic || "");
  const difficulty = normalizeText(req.query.difficulty || "");
  const type = normalizeText(req.query.type || "");
  const tags = normalize(req.query.tags || "")
    .split(",")
    .map((tag) => normalizeText(tag))
    .filter(Boolean);

  const questions = loadQuestionBank(QUESTION_LIBRARY_PATH).filter((question) => {
    const matchesTopic = !topic || normalizeText(question.topic) === topic;
    const matchesDifficulty = !difficulty || normalizeText(question.difficulty) === difficulty;
    const matchesType = !type || normalizeText(question.type) === type;
    const matchesTags = !tags.length || tags.every((tag) => question.tags.map(normalizeText).includes(tag));
    return matchesTopic && matchesDifficulty && matchesType && matchesTags;
  });

  return res.json({
    count: questions.length,
    questions: questions.map((question) => ({
      id: question.id,
      topic: question.topic,
      difficulty: question.difficulty,
      type: question.type,
      tags: question.tags,
      prompt: question.prompt,
      weight: question.weight,
    })),
  });
});

router.post("/api/practice-lab/generate-test", (req, res) => {
  const questionBank = loadQuestionBank(QUESTION_LIBRARY_PATH);
  const questionCount = Math.max(1, Math.min(100, Number.parseInt(req.body?.questionCount, 10) || 10));
  const topics = Array.isArray(req.body?.topics) ? req.body.topics : [];
  const difficultyDistribution = req.body?.difficultyDistribution || {};
  const timed = Boolean(req.body?.timed);
  const durationMinutes = Math.max(5, Math.min(180, Number.parseInt(req.body?.durationMinutes, 10) || 30));
  const userId = normalize(req.body?.userId || "anonymous");

  const generated = generateTest({
    questionBank,
    count: questionCount,
    topics,
    difficultyDistribution,
    timed,
    durationMinutes,
  });

  if (!generated.questions.length) {
    return res.status(404).json({
      error: "No questions matched the requested filters.",
      availableQuestions: questionBank.length,
    });
  }

  const testId = crypto.randomUUID();
  const startedAt = Date.now();
  const expiresAt = timed ? startedAt + durationMinutes * 60_000 : null;

  activeTests.set(testId, {
    answerKey: generated.answerKey,
    testMeta: generated.testMeta,
    userId,
    startedAt,
    expiresAt,
  });

  return res.status(201).json({
    testId,
    ...generated.testMeta,
    startedAt,
    expiresAt,
    questions: generated.questions,
  });
});

router.post("/api/practice-lab/evaluate", (req, res) => {
  const testId = normalize(req.body?.testId);
  const userAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const userId = normalize(req.body?.userId || "anonymous");

  if (!activeTests.has(testId)) {
    return res.status(404).json({ error: "Test session not found." });
  }

  const testSession = activeTests.get(testId);
  if (testSession.expiresAt && Date.now() > testSession.expiresAt) {
    activeTests.delete(testId);
    return res.status(408).json({ error: "Timed test expired before submission." });
  }

  const result = evaluateTestSubmission({
    answerKey: testSession.answerKey,
    userAnswers,
  });

  const adaptiveRecommendation = nextDifficultyFromPerformance(result.summary.percentage);

  recordAttempt({
    userId,
    testId,
    testMeta: testSession.testMeta,
    result,
  });

  activeTests.delete(testId);

  return res.json({
    testId,
    ...result,
    adaptiveRecommendation,
  });
});

router.get("/api/practice-lab/history/:userId", (req, res) => {
  const userId = normalize(req.params.userId || "anonymous");
  const history = getHistory(userId);
  return res.json({ count: history.length, history });
});

router.get("/api/practice-lab/analytics/:userId", (req, res) => {
  const userId = normalize(req.params.userId || "anonymous");
  return res.json(getAnalytics(userId));
});

router.get("/api/ptl/machines", (req, res) => {
  const search = normalizeText(req.query?.search || "");
  const track = normalizeText(req.query?.track || "all");
  const difficulty = normalizeText(req.query?.difficulty || "all");

  const filtered = MACHINE_CATALOG.filter((machine) => {
    const matchesTrack = track === "all" || normalizeText(machine.track) === track;
    const matchesDifficulty = difficulty === "all" || normalizeText(machine.difficulty) === difficulty;
    const haystack = normalizeText(`${machine.name} ${machine.description} ${(machine.tags || []).join(" ")}`);
    const matchesSearch = !search || haystack.includes(search);
    return matchesTrack && matchesDifficulty && matchesSearch;
  });

  return res.json({
    count: filtered.length,
    machines: filtered.map(({ answer, ...machine }) => machine),
  });
});

router.post("/api/ptl/start", (req, res) => {
  const machineId = normalizeText(req.body?.machineId || req.body?.labId);
  const selected = MACHINE_CATALOG.find((machine) => normalizeText(machine.id) === machineId);

  if (!selected) {
    return res.status(404).json({ error: "Machine not found." });
  }

  const instanceId = `ptl-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  activeInstances.set(instanceId, {
    machineId: selected.id,
    answer: selected.answer,
    startedAt: Date.now(),
  });

  return res.status(201).json({
    message: "Machine deployed",
    instanceId,
    expiresIn: "2h",
    connection: {
      protocol: "WireGuard VPN",
      endpoint: `lab-${selected.id}.acadly.local:51820`,
      username: "acadly-trainee",
      password: "training@123",
    },
    machine: {
      ...selected,
      answer: undefined,
    },
  });
});

router.post("/api/ptl/submit-flag", (req, res) => {
  const instanceId = req.body?.instanceId;
  const submittedFlag = normalizeText(req.body?.flag);

  if (!instanceId || !activeInstances.has(instanceId)) {
    return res.status(404).json({ error: "Session not found. Start a machine first." });
  }

  const instance = activeInstances.get(instanceId);

  if (submittedFlag === normalizeText(instance.answer)) {
    activeInstances.delete(instanceId);
    return res.json({
      correct: true,
      message: "Flag accepted. Machine completed successfully.",
      reward: 50,
    });
  }

  return res.status(400).json({
    correct: false,
    message: "Incorrect flag. Keep digging through the machine artifacts.",
  });
});

module.exports = router;
