const express = require("express");
const path = require("path");

const router = express.Router();

const FRONTEND_PATH = path.join(__dirname, "../../Frontend");

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
    description:
      "A small ecommerce API has been containerized quickly. Find the insecure Dockerfile pattern and recover the first flag.",
    objectives: [
      "Inspect image layers and identify leaked credentials.",
      "Patch the container startup process to avoid privilege escalation.",
      "Retrieve the deployment flag from the /run/secrets location.",
    ],
    answer: "PTL{docker_layers_never_forget}",
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
    description:
      "A fintech staging cluster exposes too much internally. Pivot through a misconfigured service account and secure namespace boundaries.",
    objectives: [
      "Enumerate namespaces and identify over-privileged service accounts.",
      "Use kubectl auth can-i checks to map escalation paths.",
      "Capture the control-plane flag and apply least-privilege RBAC fix.",
    ],
    answer: "PTL{k8s_rbac_is_the_real_firewall}",
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
    description:
      "Production reports are failing because of a broken migration and weak credentials policy. Restore service and capture proof of remediation.",
    objectives: [
      "Trace failing DB connections and isolate the bad migration step.",
      "Rotate credentials and patch connection string handling.",
      "Recover audit evidence and submit the resilience flag.",
    ],
    answer: "PTL{db_pooling_without_limits_hurts}",
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
    description:
      "An autonomous warehouse robot fleet is desyncing. Investigate ROS2 topics, lock down rogue publishers, and recover mission control flag.",
    objectives: [
      "Inspect ROS2 graph and detect malicious publisher behavior.",
      "Apply SROS2 policy constraints to trusted nodes only.",
      "Extract final telemetry artifact and submit the mission flag.",
    ],
    answer: "PTL{ros2_topics_need_zero_trust}",
  },
];

const activeInstances = new Map();

const normalizeText = (value = "") => value.toString().trim().toLowerCase();

router.get("/practicelab", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "practicelab.html"));
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
  const startedAt = new Date();

  activeInstances.set(instanceId, {
    machineId: selected.id,
    answer: selected.answer,
    startedAt,
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
