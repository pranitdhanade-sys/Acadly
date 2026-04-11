const vm = require("vm");

function runCodingEvaluation(question, submissionCode) {
  const testCases = question?.coding?.testCases || [];
  const functionName = question?.coding?.functionName;
  const result = {
    passed: true,
    passedCases: 0,
    totalCases: testCases.length,
    details: [],
  };

  if (!functionName || !submissionCode) {
    return { ...result, passed: false, details: ["Missing coding answer or function metadata."] };
  }

  const sandbox = {};
  vm.createContext(sandbox);

  try {
    vm.runInContext(submissionCode, sandbox, { timeout: 1000 });
  } catch (error) {
    return { ...result, passed: false, details: [`Code execution error: ${error.message}`] };
  }

  const fn = sandbox[functionName];
  if (typeof fn !== "function") {
    return { ...result, passed: false, details: [`Function ${functionName} was not found in submission.`] };
  }

  for (const testCase of testCases) {
    try {
      const output = fn(...(testCase.input || []));
      const passed = JSON.stringify(output) === JSON.stringify(testCase.expectedOutput);
      result.details.push(
        `${testCase.description || "Test case"}: ${passed ? "passed" : "failed"}`
      );
      if (!passed) {
        result.passed = false;
      } else {
        result.passedCases += 1;
      }
    } catch (error) {
      result.passed = false;
      result.details.push(`${testCase.description || "Test case"}: failed (${error.message})`);
    }
  }

  return result;
}

function evaluateTestSubmission({ answerKey, userAnswers }) {
  const answersById = new Map((userAnswers || []).map((answer) => [answer.questionId, answer]));

  let earnedScore = 0;
  let maxScore = 0;
  let correctCount = 0;

  const breakdown = answerKey.map((question) => {
    const answer = answersById.get(question.id);
    const weight = Number(question.weight || 1);
    maxScore += weight;

    if (!answer) {
      return {
        questionId: question.id,
        correct: false,
        score: 0,
        maxScore: weight,
        explanation: question.explanation,
        feedback: "Not answered",
      };
    }

    if (question.type === "mcq") {
      const isCorrect = String(answer.answer).trim() === String(question.correctAnswer).trim();
      const score = isCorrect ? weight : 0;
      earnedScore += score;
      if (isCorrect) correctCount += 1;

      return {
        questionId: question.id,
        correct: isCorrect,
        score,
        maxScore: weight,
        explanation: question.explanation,
        feedback: isCorrect ? "Correct" : "Incorrect",
      };
    }

    if (question.type === "coding") {
      const codingResult = runCodingEvaluation(question, answer.answer);
      const score = codingResult.totalCases
        ? Number(((codingResult.passedCases / codingResult.totalCases) * weight).toFixed(2))
        : 0;

      earnedScore += score;
      if (codingResult.passed) correctCount += 1;

      return {
        questionId: question.id,
        correct: codingResult.passed,
        score,
        maxScore: weight,
        explanation: question.explanation,
        feedback: codingResult.details,
      };
    }

    const normalized = String(answer.answer || "").toLowerCase().trim();
    const expected = String(question.correctAnswer || "").toLowerCase().trim();
    const isCorrect = normalized && expected && normalized === expected;
    const score = isCorrect ? weight : 0;
    earnedScore += score;
    if (isCorrect) correctCount += 1;

    return {
      questionId: question.id,
      correct: isCorrect,
      score,
      maxScore: weight,
      explanation: question.explanation,
      feedback: isCorrect ? "Matched expected answer" : "Answer differs from expected answer",
    };
  });

  return {
    summary: {
      earnedScore: Number(earnedScore.toFixed(2)),
      maxScore: Number(maxScore.toFixed(2)),
      percentage: maxScore ? Number(((earnedScore / maxScore) * 100).toFixed(2)) : 0,
      correctCount,
      totalQuestions: answerKey.length,
    },
    breakdown,
  };
}

module.exports = {
  evaluateTestSubmission,
};
