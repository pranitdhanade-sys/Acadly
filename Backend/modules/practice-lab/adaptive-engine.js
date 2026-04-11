function nextDifficultyFromPerformance(percentage) {
  if (percentage >= 80) return "hard";
  if (percentage >= 50) return "medium";
  return "easy";
}

module.exports = {
  nextDifficultyFromPerformance,
};
