const express = require("express");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const FRONTEND_PATH = path.join(__dirname, "../../Frontend");
const QUESTIONS_ROOT = path.join(__dirname, "../../Questions/Subject");

const MACHINE_CATALOG = [
  {
    id: "docker-drift",
    name: "Docker Drift",
    track: "Docker",
    difficulty: "easy",
    points: 100,
    solveRate: "72%",
    duration: "25-40 min",
    tags: ["containers", "hardening", "forensics"],
    description: "Fix insecure Docker layers and recover leaked deployment secrets.",
    objectives: [
      "Inspect layers for leaked secrets.",
      "Patch the Dockerfile hardening gaps.",
      "Recover the first flag from runtime secrets.",
    ],
    answer: "PTL{docker_layers_never_forget}",
  },
  {
    id: "docker-supply-chain",
    name: "Docker Supply Chain",
    track: "Docker",
    difficulty: "medium",
    points: 210,
    solveRate: "47%",
    duration: "40-60 min",
    tags: ["image-signing", "sbom", "registry"],
    description: "Secure vulnerable image build pipeline and enforce signed pushes.",
    objectives: [
      "Generate SBOM and identify critical CVEs.",
      "Sign and verify trusted images.",
      "Capture the pipeline integrity flag.",
    ],
    answer: "PTL{signed_images_reduce_supply_chain_risk}",
  },
  {
    id: "kube-breach",
    name: "Kube Breach",
    track: "Kubernetes",
    difficulty: "medium",
    points: 220,
    solveRate: "49%",
    duration: "45-70 min",
    tags: ["rbac", "network-policy", "cluster"],
    description: "Contain a privilege escalation path in a misconfigured staging cluster.",
    objectives: [
      "Find over-privileged service accounts.",
      "Apply RBAC least-privilege policy.",
      "Submit the control-plane flag.",
    ],
    answer: "PTL{k8s_rbac_is_the_real_firewall}",
  },
  {
    id: "kube-chaos-garden",
    name: "Kube Chaos Garden",
    track: "Kubernetes",
    difficulty: "hard",
    points: 300,
    solveRate: "31%",
    duration: "60-90 min",
    tags: ["helm", "pod-security", "secrets"],
    description: "Repair broken Helm deployment with policy and secret safety fixes.",
    objectives: [
      "Identify crashing pods and misconfigurations.",
      "Rotate and scope secret access.",
      "Recover the incident-response flag.",
    ],
    answer: "PTL{k8s_helm_without_guardrails_breaks_fast}",
  },
  {
    id: "terraform-state-heist",
    name: "Terraform State Heist",
    track: "Terraform",
    difficulty: "medium",
    points: 240,
    solveRate: "44%",
    duration: "45-65 min",
    tags: ["iac", "state-file", "cloud-security"],
    description: "Repair an IaC workflow after sensitive values leaked via state.",
    objectives: [
      "Audit leaked state values.",
      "Move to secure remote backend locking.",
      "Capture the IaC compliance flag.",
    ],
    answer: "PTL{terraform_state_is_production_data}",
  },
  {
    id: "terraform-drift-hunt",
    name: "Terraform Drift Hunt",
    track: "Terraform",
    difficulty: "easy",
    points: 140,
    solveRate: "66%",
    duration: "25-40 min",
    tags: ["drift", "plan", "modules"],
    description: "Detect manual cloud drift and reconcile to a clean plan/apply cycle.",
    objectives: [
      "Detect infrastructure drift.",
      "Refactor repeated resources into modules.",
      "Submit the drift-control flag.",
    ],
    answer: "PTL{terraform_plan_before_every_apply}",
  },
  {
    id: "ansys-sim-shield",
    name: "ANSYS Sim Shield",
    track: "ANSYS",
    difficulty: "medium",
    points: 260,
    solveRate: "39%",
    duration: "50-75 min",
    tags: ["simulation", "hpc", "license-server"],
    description: "Fix simulation pipeline failures and harden ANSYS license access.",
    objectives: [
      "Correct solver batch settings.",
      "Restrict license server surface.",
      "Capture engineering-run flag.",
    ],
    answer: "PTL{ansys_workflows_need_secure_runtime}",
  },
  {
    id: "ansys-postprocess-race",
    name: "ANSYS Postprocess Race",
    track: "ANSYS",
    difficulty: "hard",
    points: 320,
    solveRate: "24%",
    duration: "70-95 min",
    tags: ["mesh", "postprocess", "storage"],
    description: "Recover failed CFD result pipeline and prevent data-loss in shared storage.",
    objectives: [
      "Repair broken result export job.",
      "Harden shared result storage permissions.",
      "Submit the postprocess flag.",
    ],
    answer: "PTL{ansys_results_need_strict_storage_acl}",
  },
  {
    id: "db-blackout",
    name: "DB Blackout",
    track: "Database",
    difficulty: "medium",
    points: 200,
    solveRate: "53%",
    duration: "35-55 min",
    tags: ["mysql", "postgres", "connection-pooling"],
    description: "Recover broken migrations and stabilize DB connectivity under load.",
    objectives: [
      "Identify failing migration path.",
      "Fix connection string and pool limits.",
      "Retrieve database resilience flag.",
    ],
    answer: "PTL{db_pooling_without_limits_hurts}",
  },
  {
    id: "db-replica-failover",
    name: "DB Replica Failover",
    track: "Database",
    difficulty: "hard",
    points: 310,
    solveRate: "29%",
    duration: "65-90 min",
    tags: ["replication", "failover", "recovery"],
    description: "Promote a broken replica safely and restore read/write consistency.",
    objectives: [
      "Diagnose replication lag root cause.",
      "Promote replica and restore consistency checks.",
      "Submit the failover proof flag.",
    ],
    answer: "PTL{safe_failover_beats_fast_failover}",
  },
  {
    id: "ros2-relay",
    name: "ROS2 Relay",
    track: "ROS2",
    difficulty: "hard",
    points: 320,
    solveRate: "28%",
    duration: "70-95 min",
    tags: ["robotics", "dds", "node-security"],
    description: "Stop rogue topic publishers in a warehouse robotics fleet.",
    objectives: [
      "Map suspicious ROS2 graph behavior.",
      "Apply SROS2 policy restrictions.",
      "Capture mission control flag.",
    ],
    answer: "PTL{ros2_topics_need_zero_trust}",
  },
];

const activeInstances = new Map();

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
  const difficulty = normalizeText(config.difficulty || "medium");
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

  const topicDirs = !topic || topic.toLowerCase() === "all topics"
    ? fs
      .readdirSync(subjectDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
    : [topic];

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

router.get("/api/ptl/machines", (req, res) => {
  const track = normalizeText(req.query.track);
  const difficulty = normalizeText(req.query.difficulty);
  const search = normalizeText(req.query.search);

  const filtered = MACHINE_CATALOG.filter((machine) => {
    const matchesTrack = !track || track === "all" || normalizeText(machine.track) === track;
    const matchesDifficulty =
      !difficulty || difficulty === "all" || normalizeText(machine.difficulty) === difficulty;
    const matchesSearch =
      !search ||
      normalizeText(machine.name).includes(search) ||
      normalizeText(machine.description).includes(search) ||
      machine.tags.some((tag) => normalizeText(tag).includes(search));

    return matchesTrack && matchesDifficulty && matchesSearch;
  });

  res.json({
    count: filtered.length,
    machines: filtered.map(({ answer, ...machine }) => machine),
  });
});

router.post("/api/ptl/start", (req, res) => {
  const machineId = normalizeText(req.body?.machineId);
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
