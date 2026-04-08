const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const FRONTEND_PATH = path.join(__dirname, "../../Frontend");
const QUESTIONS_ROOT = path.join(__dirname, "../../Questions/Subject");

const LAB_CATALOG = [
  {
    id: "docker-basics",
    name: "Docker Basics Lab",
    track: "Docker",
    level: "beginner",
    duration: "30 min",
    description: "Learn core Docker commands for image pull, run, inspect, and cleanup.",
    tasks: [
      { id: "d1", title: "List local images", instruction: "Show all local Docker images.", expectedCommand: "docker images", hint: "Use the images subcommand." },
      { id: "d2", title: "Run Ubuntu container", instruction: "Run an interactive Ubuntu container.", expectedCommand: "docker run -it ubuntu", hint: "Need -it for interactive shell." },
      { id: "d3", title: "List containers", instruction: "List running containers.", expectedCommand: "docker ps", hint: "Use ps subcommand." },
    ],
  },
  {
    id: "docker-networking",
    name: "Docker Networking Lab",
    track: "Docker",
    level: "intermediate",
    duration: "40 min",
    description: "Practice container networking, custom bridges, and port mapping.",
    tasks: [
      { id: "dn1", title: "Create bridge network", instruction: "Create a user-defined bridge network named app-net.", expectedCommand: "docker network create app-net", hint: "Start with docker network create." },
      { id: "dn2", title: "Inspect network", instruction: "Inspect the app-net network details.", expectedCommand: "docker network inspect app-net", hint: "Use network inspect." },
    ],
  },
  {
    id: "kubernetes-core",
    name: "Kubernetes Core Lab",
    track: "Kubernetes",
    level: "beginner",
    duration: "45 min",
    description: "Learn kubectl basics for pods, deployments, and logs.",
    tasks: [
      { id: "k1", title: "Get pods", instruction: "List all pods in current namespace.", expectedCommand: "kubectl get pods", hint: "Start with kubectl get." },
      { id: "k2", title: "Create deployment", instruction: "Create nginx deployment with 2 replicas.", expectedCommand: "kubectl create deployment nginx", hint: "Use kubectl create deployment." },
      { id: "k3", title: "View logs", instruction: "Check logs for pod nginx.", expectedCommand: "kubectl logs", hint: "logs command with pod name." },
    ],
  },
  {
    id: "kubernetes-troubleshooting",
    name: "Kubernetes Troubleshooting",
    track: "Kubernetes",
    level: "advanced",
    duration: "60 min",
    description: "Diagnose cluster issues using describe/events and rollout commands.",
    tasks: [
      { id: "kt1", title: "Describe failing pod", instruction: "Describe a failing pod for root-cause clues.", expectedCommand: "kubectl describe pod", hint: "describe shows events." },
      { id: "kt2", title: "Check rollout status", instruction: "Check deployment rollout status.", expectedCommand: "kubectl rollout status deployment", hint: "Use rollout status." },
    ],
  },
  {
    id: "terraform-starter",
    name: "Terraform Starter Lab",
    track: "Terraform",
    level: "beginner",
    duration: "35 min",
    description: "Practice Terraform init/plan/apply workflow.",
    tasks: [
      { id: "t1", title: "Initialize project", instruction: "Initialize Terraform in current directory.", expectedCommand: "terraform init", hint: "First command is init." },
      { id: "t2", title: "Preview changes", instruction: "Preview infra changes before apply.", expectedCommand: "terraform plan", hint: "Use plan before apply." },
      { id: "t3", title: "Apply changes", instruction: "Apply infrastructure changes.", expectedCommand: "terraform apply", hint: "Use apply to provision." },
    ],
  },
  {
    id: "terraform-state",
    name: "Terraform State Lab",
    track: "Terraform",
    level: "intermediate",
    duration: "45 min",
    description: "Learn state inspection and drift reconciliation commands.",
    tasks: [
      { id: "ts1", title: "List state resources", instruction: "List resources tracked in state.", expectedCommand: "terraform state list", hint: "Use state list." },
      { id: "ts2", title: "Show a resource", instruction: "Show details of one tracked resource.", expectedCommand: "terraform state show", hint: "state show <resource>." },
    ],
  },
  {
    id: "ansys-job-ops",
    name: "ANSYS Job Ops Lab",
    track: "ANSYS",
    level: "intermediate",
    duration: "50 min",
    description: "Learn core ANSYS batch execution and output validation commands.",
    tasks: [
      { id: "a1", title: "Run batch simulation", instruction: "Run ANSYS in batch mode with an input file.", expectedCommand: "ansys -b -i", hint: "Use -b and -i flags." },
      { id: "a2", title: "Check output logs", instruction: "Inspect simulation output log file.", expectedCommand: "tail -f", hint: "tail is useful for live logs." },
    ],
  },
  {
    id: "database-cli",
    name: "Database CLI Lab",
    track: "Database",
    level: "beginner",
    duration: "30 min",
    description: "Practice MySQL/PostgreSQL command-line connectivity and query checks.",
    tasks: [
      { id: "db1", title: "Connect to MySQL", instruction: "Connect to a MySQL server using CLI.", expectedCommand: "mysql -u", hint: "mysql -u <user> -p" },
      { id: "db2", title: "List databases", instruction: "List all databases after connecting.", expectedCommand: "show databases", hint: "Use SQL command show databases;" },
    ],
  },
  {
    id: "database-performance",
    name: "Database Performance Lab",
    track: "Database",
    level: "advanced",
    duration: "55 min",
    description: "Analyze slow queries and indexing workflow.",
    tasks: [
      { id: "dp1", title: "Explain query plan", instruction: "Get query plan for a slow query.", expectedCommand: "explain", hint: "EXPLAIN SELECT ..." },
      { id: "dp2", title: "Create index", instruction: "Create an index to optimize lookup.", expectedCommand: "create index", hint: "SQL create index statement." },
    ],
  },
  {
    id: "ros2-basics",
    name: "ROS2 Basics Lab",
    track: "ROS2",
    level: "beginner",
    duration: "40 min",
    description: "Practice ROS2 node/topic introspection commands.",
    tasks: [
      { id: "r1", title: "List nodes", instruction: "List currently active ROS2 nodes.", expectedCommand: "ros2 node list", hint: "Use ros2 node list." },
      { id: "r2", title: "List topics", instruction: "List all active ROS2 topics.", expectedCommand: "ros2 topic list", hint: "Use ros2 topic list." },
      { id: "r3", title: "Echo topic", instruction: "Echo data from a topic.", expectedCommand: "ros2 topic echo", hint: "topic echo <topic_name>" },
    ],
  },
];

const activeLabSessions = new Map();

const normalizeName = (value = "") => value.toString().trim();
const normalizeText = (value = "") => normalizeName(value).toLowerCase();

router.get("/practicelab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicelab.html"));
});

router.get("/practicallab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicallab.html"));
});

const readQuestionFile = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
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
  const difficulty = normalizeText(config.difficulty || "medium");
  const requestedCount = Number.parseInt(config.questions, 10) || 10;

  if (!subject) return res.status(400).json({ error: "Subject is required." });

  const subjectDir = path.join(QUESTIONS_ROOT, subject);
  if (!fs.existsSync(subjectDir)) {
    return res.status(404).json({ error: `No question bank found for subject: ${subject}`, searchedPath: subjectDir });
  }

  const topicDirs = !topic || topic.toLowerCase() === "all topics"
    ? fs.readdirSync(subjectDir, { withFileTypes: true }).filter((dirent) => dirent.isDirectory()).map((dirent) => dirent.name)
    : [topic];

  let allQuestions = [];
  topicDirs.forEach((topicName) => {
    const filePath = path.join(subjectDir, topicName, `${difficulty}.json`);
    const questions = readQuestionFile(filePath).map((q) => ({ ...q, topic: topicName, subject, difficulty }));
    allQuestions = allQuestions.concat(questions);
  });

  if (allQuestions.length === 0) {
    return res.status(404).json({ error: `No ${difficulty} questions found for the selected filters.`, subject, topic });
  }

  const generatedQuestions = pickRandomQuestions(allQuestions, Math.max(1, Math.min(requestedCount, allQuestions.length)));
  return res.json({ message: "Lab started", config, totalAvailable: allQuestions.length, generatedCount: generatedQuestions.length, questions: generatedQuestions });
});

router.get("/api/ptl/labs", (req, res) => {
  const track = normalizeText(req.query.track);
  const level = normalizeText(req.query.level);
  const search = normalizeText(req.query.search);

  const labs = LAB_CATALOG.filter((lab) => {
    const trackMatch = !track || track === "all" || normalizeText(lab.track) === track;
    const levelMatch = !level || level === "all" || normalizeText(lab.level) === level;
    const searchMatch = !search || normalizeText(lab.name).includes(search) || normalizeText(lab.description).includes(search);
    return trackMatch && levelMatch && searchMatch;
  });

  return res.json({
    count: labs.length,
    labs: labs.map((lab) => ({
      id: lab.id,
      name: lab.name,
      track: lab.track,
      level: lab.level,
      duration: lab.duration,
      description: lab.description,
      taskCount: lab.tasks.length,
    })),
  });
});

router.post("/api/ptl/start", (req, res) => {
  const labId = normalizeText(req.body?.labId || req.body?.machineId);
  const lab = LAB_CATALOG.find((item) => normalizeText(item.id) === labId);

  if (!lab) return res.status(404).json({ error: "Lab not found." });

  const sessionId = `lab-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  activeLabSessions.set(sessionId, {
    labId: lab.id,
    completedTaskIds: [],
    startedAt: Date.now(),
  });

  return res.status(201).json({
    message: "Learning lab started.",
    sessionId,
    expiresIn: "2h",
    lab: {
      id: lab.id,
      name: lab.name,
      track: lab.track,
      level: lab.level,
      duration: lab.duration,
      description: lab.description,
      tasks: lab.tasks.map((task) => ({ id: task.id, title: task.title, instruction: task.instruction, hint: task.hint })),
    },
  });
});

router.post("/api/ptl/complete-task", (req, res) => {
  const sessionId = req.body?.sessionId;
  const taskId = normalizeText(req.body?.taskId);
  const command = normalizeText(req.body?.command);

  if (!sessionId || !activeLabSessions.has(sessionId)) {
    return res.status(404).json({ error: "Session not found. Start a lab first." });
  }

  const session = activeLabSessions.get(sessionId);
  const lab = LAB_CATALOG.find((item) => item.id === session.labId);
  const task = lab?.tasks.find((item) => normalizeText(item.id) === taskId);

  if (!task) return res.status(404).json({ error: "Task not found." });

  const expected = normalizeText(task.expectedCommand);
  const success = command.includes(expected);

  if (success && !session.completedTaskIds.includes(task.id)) {
    session.completedTaskIds.push(task.id);
  }

  const completed = session.completedTaskIds.length;
  const total = lab.tasks.length;

  return res.json({
    success,
    message: success ? "Great! Command accepted." : `Not quite. Try using: ${task.hint}`,
    progress: `${completed}/${total}`,
    completedTaskIds: session.completedTaskIds,
    labCompleted: completed === total,
  });
});

module.exports = router;
