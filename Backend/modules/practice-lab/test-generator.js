function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function normalizeDifficultyDistribution(distribution = {}, requestedCount) {
  const defaults = { easy: 0.34, medium: 0.33, hard: 0.33 };
  const configured = { ...defaults, ...distribution };
  const totalRatio = Object.values(configured).reduce((acc, value) => acc + Number(value || 0), 0) || 1;

  const targets = Object.entries(configured).reduce((acc, [difficulty, ratio]) => {
    acc[difficulty] = Math.floor((Number(ratio || 0) / totalRatio) * requestedCount);
    return acc;
  }, {});

  let assigned = Object.values(targets).reduce((acc, value) => acc + value, 0);
  const order = ["medium", "easy", "hard"];
  let pointer = 0;

  while (assigned < requestedCount) {
    const key = order[pointer % order.length];
    targets[key] = (targets[key] || 0) + 1;
    assigned += 1;
    pointer += 1;
  }

  return targets;
}

function sanitizeQuestionForDelivery(question) {
  const shuffledOptions = question.type === "mcq" ? shuffle(question.options || []) : question.options || [];

  return {
    id: question.id,
    prompt: question.prompt,
    topic: question.topic,
    difficulty: question.difficulty,
    type: question.type,
    tags: question.tags,
    options: shuffledOptions,
    weight: question.weight,
    coding: question.coding
      ? {
          language: question.coding.language,
          starterCode: question.coding.starterCode,
          functionName: question.coding.functionName,
          testCaseDescription: (question.coding.testCases || []).map((testCase) => testCase.description),
        }
      : null,
  };
}

function generateTest({ questionBank, count, topics = [], difficultyDistribution = {}, timed = false, durationMinutes = 30 }) {
  const normalizedTopics = topics.map((topic) => topic.toLowerCase());
  const filteredByTopic = normalizedTopics.length
    ? questionBank.filter((question) => normalizedTopics.includes(String(question.topic).toLowerCase()))
    : questionBank;

  const difficultyTargets = normalizeDifficultyDistribution(difficultyDistribution, count);

  const selected = [];
  const selectedIds = new Set();

  for (const [difficulty, targetCount] of Object.entries(difficultyTargets)) {
    const pool = shuffle(
      filteredByTopic.filter(
        (question) => String(question.difficulty).toLowerCase() === difficulty && !selectedIds.has(question.id)
      )
    );

    for (const question of pool.slice(0, targetCount)) {
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  if (selected.length < count) {
    const remainingPool = shuffle(filteredByTopic.filter((question) => !selectedIds.has(question.id)));
    for (const question of remainingPool) {
      if (selected.length >= count) break;
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  const finalQuestions = shuffle(selected).slice(0, count);

  return {
    testMeta: {
      requestedCount: count,
      generatedCount: finalQuestions.length,
      topics,
      difficultyDistribution: difficultyTargets,
      timed,
      durationMinutes: timed ? durationMinutes : null,
    },
    questions: finalQuestions.map(sanitizeQuestionForDelivery),
    answerKey: finalQuestions.map((question) => ({
      id: question.id,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      type: question.type,
      weight: question.weight,
      coding: question.coding,
      difficulty: question.difficulty,
    })),
  };
}

module.exports = {
  generateTest,
};
