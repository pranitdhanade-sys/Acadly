const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "../../data/practice-lab-history.json");

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: {} }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

function writeStore(data) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function recordAttempt({ userId, testId, testMeta, result }) {
  const store = readStore();
  const key = userId || "anonymous";

  if (!store.users[key]) {
    store.users[key] = [];
  }

  store.users[key].push({
    testId,
    testMeta,
    result,
    attemptedAt: new Date().toISOString(),
  });

  writeStore(store);
}

function getHistory(userId) {
  const store = readStore();
  const key = userId || "anonymous";
  return store.users[key] || [];
}

function getAnalytics(userId) {
  const history = getHistory(userId);
  if (!history.length) {
    return {
      attempts: 0,
      averagePercentage: 0,
      latestPercentage: 0,
      topicBreakdown: {},
    };
  }

  const averagePercentage =
    history.reduce((acc, item) => acc + Number(item.result?.summary?.percentage || 0), 0) / history.length;

  const topicBreakdown = history.reduce((acc, item) => {
    const topics = item.testMeta?.topics || ["mixed"];
    for (const topic of topics) {
      if (!acc[topic]) {
        acc[topic] = { attempts: 0, avgPercentage: 0, totalPercentage: 0 };
      }
      acc[topic].attempts += 1;
      acc[topic].totalPercentage += Number(item.result?.summary?.percentage || 0);
      acc[topic].avgPercentage = Number((acc[topic].totalPercentage / acc[topic].attempts).toFixed(2));
    }
    return acc;
  }, {});

  return {
    attempts: history.length,
    averagePercentage: Number(averagePercentage.toFixed(2)),
    latestPercentage: Number(history[history.length - 1].result?.summary?.percentage || 0),
    topicBreakdown,
  };
}

module.exports = {
  recordAttempt,
  getHistory,
  getAnalytics,
};
