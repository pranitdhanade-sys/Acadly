const express = require("express");
const path = require("path");

const router = express.Router();

const FRONTEND_PATH = path.join(__dirname, "../../Frontend");

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

    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.questions)) return parsed.questions;
    return [];
  } catch (err) {
    return [];
  }
};
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
    id: "kube-chaos-garden",
    name: "Kube Chaos Garden",
    track: "Kubernetes",
    difficulty: "hard",
    points: 300,
    solveRate: "31%",
    duration: "60-90 min",
    tags: ["helm", "pod-security", "secrets"],
    description:
      "A Helm release has drifted from security baseline and pods are crashing. Stabilize workloads, fix policy gaps, and recover the incident flag.",
    objectives: [
      "Audit failing deployments and identify securityContext issues.",
      "Lock down secret access and rotate compromised tokens.",
      "Restore service health and retrieve the postmortem flag.",
    ],
    answer: "PTL{k8s_helm_without_guardrails_breaks_fast}",
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
    id: "terraform-state-heist",
    name: "Terraform State Heist",
    track: "Terraform",
    difficulty: "medium",
    points: 240,
    solveRate: "44%",
    duration: "45-65 min",
    tags: ["iac", "state-file", "cloud-security"],
    description:
      "A leaked Terraform state file exposed sensitive outputs. Repair the infrastructure plan, secure remote state, and submit the IaC flag.",
    objectives: [
      "Locate secrets exposed in local terraform.tfstate artifacts.",
      "Migrate to a secure remote backend with locking enabled.",
      "Apply sanitized plan and capture the compliance flag.",
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
    description:
      "Cloud resources were modified manually outside Terraform. Detect drift, refactor modules, and restore deterministic deployments.",
    objectives: [
      "Run drift checks and map unmanaged infrastructure changes.",
      "Refactor duplicated resources into reusable modules.",
      "Reconcile state and submit the drift-control flag.",
    ],
    answer: "PTL{terraform_plan_before_every_apply}",
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
  {
    id: "ansys-sim-shield",
    name: "ANSYS Sim Shield",
    track: "ANSYS",
    difficulty: "medium",
    points: 260,
    solveRate: "39%",
    duration: "50-75 min",
    tags: ["simulation", "hpc", "license-server"],
    description:
      "A simulation pipeline is failing because of broken solver configs and open license service ports. Harden the runbook and extract the engineering flag.",
    objectives: [
      "Inspect ANSYS batch job logs and fix solver parameter mismatch.",
      "Restrict license server exposure to approved subnets only.",
      "Validate successful simulation output and capture the lab flag.",
    ],
    answer: "PTL{ansys_workflows_need_secure_runtime}",
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
    description:
      "A container registry has unsigned images and vulnerable base layers. Build a secure supply-chain workflow and prove integrity.",
    objectives: [
      "Generate an SBOM and identify vulnerable dependencies.",
      "Sign trusted images and enforce admission checks.",
      "Promote secure image and retrieve the pipeline flag.",
    ],
    answer: "PTL{signed_images_reduce_supply_chain_risk}",
  },
];

const activeInstances = new Map();

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

const pickRandomQuestions = (items, limit) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
router.post("/api/ptl/start", (req, res) => {
  const machineId = normalizeText(req.body?.machineId);
  const selected = MACHINE_CATALOG.find((machine) => normalizeText(machine.id) === machineId);

  if (!selected) {
    return res.status(404).json({ error: "Machine not found." });
  }

  const instanceId = `ptl-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const startedAt = new Date();

router.post("/api/start-lab", (req, res) => {
  const config = req.body || {};
  const subject = normalizeName(config.subject);
  const topic = normalizeName(config.topic);
  const difficulty = normalizeText(config.difficulty || "medium");
  const requestedCount = Number.parseInt(config.questions, 10) || 10;
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

  if (!subject) return res.status(400).json({ error: "Subject is required." });
  if (!instanceId || !activeInstances.has(instanceId)) {
    return res.status(404).json({ error: "Session not found. Start a machine first." });
  }

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
    ? fs
      .readdirSync(subjectDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
    : [topic];
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
    startedAt: new Date(),
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
  const labId = normalizeText(req.body?.labId || req.body?.machineId);
  const lab = LAB_CATALOG.find((item) => normalizeText(item.id) === labId);

  if (!lab) return res.status(404).json({ error: "Lab not found." });

  const sessionId = `lab-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  activeLabSessions.set(sessionId, {
    labId: lab.id,
    completedTaskIds: [],
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
