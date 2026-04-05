const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const FRONTEND_PATH = path.join(__dirname, "../../Frontend");
const QUESTIONS_ROOT = path.join(__dirname, "../../Questions/Subject");

router.get("/practicelab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicelab.html"));
});

const normalizeName = (value = "") => value.toString().trim();

const readQuestionFile = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed.questions)) {
      return parsed.questions;
    }

    return [];
  } catch (err) {
    return [];
  }
};

const pickRandomQuestions = (items, limit) => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, limit);
};

router.post("/api/start-lab", (req, res) => {
  const config = req.body || {};

  const subject = normalizeName(config.subject);
  const topic = normalizeName(config.topic);
  const difficulty = normalizeName(config.difficulty || "medium").toLowerCase();
  const requestedCount = Number.parseInt(config.questions, 10) || 10;

  if (!subject) {
    return res.status(400).json({ error: "Subject is required." });
  }

  const subjectDir = path.join(QUESTIONS_ROOT, subject);

  if (!fs.existsSync(subjectDir)) {
    return res.status(404).json({
      error: `No question bank found for subject: ${subject}`,
      searchedPath: subjectDir,
    });
  }

  let topicDirs = [];
  if (!topic || topic.toLowerCase() === "all topics") {
    topicDirs = fs
      .readdirSync(subjectDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } else {
    topicDirs = [topic];
  }

  let allQuestions = [];

  topicDirs.forEach((topicName) => {
    const filePath = path.join(subjectDir, topicName, `${difficulty}.json`);
    const questions = readQuestionFile(filePath).map((q) => ({
      ...q,
      topic: topicName,
      subject,
      difficulty,
    }));

    allQuestions = allQuestions.concat(questions);
  });

  if (allQuestions.length === 0) {
    return res.status(404).json({
      error: `No ${difficulty} questions found for the selected filters.`,
      subject,
      topic,
    });
  }

  const generatedQuestions = pickRandomQuestions(
    allQuestions,
    Math.max(1, Math.min(requestedCount, allQuestions.length))
  );

  return res.json({
    message: "Lab started",
    config,
    totalAvailable: allQuestions.length,
    generatedCount: generatedQuestions.length,
    questions: generatedQuestions,
  });
});

module.exports = router;
