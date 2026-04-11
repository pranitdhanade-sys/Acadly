const fs = require("fs");
const path = require("path");

const SUPPORTED_EXTENSIONS = new Set([".json", ".yaml", ".yml"]);

function parseYamlScalar(value) {
  const cleaned = String(value || "").trim();
  if (cleaned === "true") return true;
  if (cleaned === "false") return false;
  if (cleaned === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  return cleaned.replace(/^['"]|['"]$/g, "");
}

function basicYamlToQuestions(content) {
  const lines = content.split(/\r?\n/);
  const questions = [];
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith("#")) continue;

    if (/^-\s+id:\s*/.test(line.trim())) {
      if (current) questions.push(current);
      current = { tags: [], options: [] };
      current.id = parseYamlScalar(line.split(/id:\s*/)[1]);
      continue;
    }

    if (!current) continue;

    const keyValueMatch = line.trim().match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      if (value.startsWith("[") && value.endsWith("]")) {
        current[key] = value
          .slice(1, -1)
          .split(",")
          .map((item) => parseYamlScalar(item))
          .filter((item) => String(item).length);
      } else {
        current[key] = parseYamlScalar(value);
      }
    }
  }

  if (current) questions.push(current);
  return questions;
}

function readQuestionFile(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(extension)) return [];

  const content = fs.readFileSync(filePath, "utf8");
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    parsed = { questions: basicYamlToQuestions(content) };
  }

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  return [];
}

function crawlQuestionFiles(rootDir) {
  if (!fs.existsSync(rootDir)) return [];

  const queue = [rootDir];
  const files = [];

  while (queue.length) {
    const currentDir = queue.shift();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else {
        const extension = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.has(extension)) {
          files.push(fullPath);
        }
      }
    }
  }

  return files;
}

function normalizeQuestion(question, sourceFile) {
  return {
    id: question.id,
    prompt: question.prompt,
    topic: question.topic,
    difficulty: question.difficulty,
    type: question.type,
    tags: Array.isArray(question.tags) ? question.tags : [],
    options: Array.isArray(question.options) ? question.options : [],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation || "No explanation provided.",
    weight: Number.isFinite(question.weight) ? question.weight : 1,
    coding: question.coding || null,
    sourceFile,
  };
}

function validateQuestion(question) {
  const required = ["id", "prompt", "topic", "difficulty", "type", "tags"];
  return required.every((field) => question[field] !== undefined && question[field] !== null);
}

function loadQuestionBank(rootDir) {
  const files = crawlQuestionFiles(rootDir);
  const questions = [];

  for (const filePath of files) {
    try {
      const parsed = readQuestionFile(filePath);
      for (const raw of parsed) {
        const normalized = normalizeQuestion(raw, filePath);
        if (validateQuestion(normalized)) {
          questions.push(normalized);
        }
      }
    } catch (error) {
      console.warn(`Failed to load question file ${filePath}: ${error.message}`);
    }
  }

  return questions;
}

module.exports = {
  loadQuestionBank,
};
