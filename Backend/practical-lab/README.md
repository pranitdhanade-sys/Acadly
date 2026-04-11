# Practical Lab Module (CTF-style)

## Folder structure

```text
Backend/
  routes/
    practical-lab.js                 # REST APIs for launch/state/flag/hints/reset/leaderboard
  services/
    environmentProvider.js           # Docker/Kubernetes provisioning + teardown
    practicalLabStore.js             # In-memory lab/session state + scoring store
  labs/
    docker-misconfiguration.json     # Sample lab 1
    kubernetes-pod-debugging.json    # Sample lab 2
    network-policy-restriction.json  # Sample lab 3
  practical-lab/
    README.md                        # Architecture + API contract
```

## API endpoints

Base path: `/api/practical-labs`

- `GET /labs` - list all lab definitions.
- `GET /labs/:labId` - get one lab's details and objective.
- `POST /labs/:labId/launch` - provision an ephemeral environment for user.
- `GET /sessions?userId=<id>` - list sessions for a user.
- `GET /sessions/:sessionId` - fetch a single session state.
- `POST /sessions/:sessionId/submit-flag` - submit a flag to complete lab.
- `POST /sessions/:sessionId/hints/unlock` - unlock next hint + guide step.
- `POST /sessions/:sessionId/reset` - teardown and recreate environment.
- `GET /leaderboard?limit=10` - top users by cumulative score.

### State model

Session state values:
- `running`
- `completed`
- `expired`
- `reset`

## Sample lab config format (JSON)

```json
{
  "id": "docker-misconfig-001",
  "title": "Docker Misconfiguration Lab",
  "difficulty": "medium",
  "timeoutMinutes": 45,
  "problemStatement": "...",
  "objective": "...",
  "hints": ["..."],
  "guide": ["Step 1..."],
  "flag": "PTL{...}",
  "runtime": {
    "provider": "docker",
    "image": "ghcr.io/acadly/labs/docker-misconfig:latest"
  }
}
```

## Provisioning flow

1. API receives launch request.
2. Route loads lab config and calls `provisionEnvironment`.
3. Service uses Docker API via CLI (`docker run`) or Kubernetes API via CLI (`kubectl create namespace`) as runtime hooks.
4. Session is stored with timeout and runtime metadata.
5. Auto-expire timer triggers teardown (`docker rm -f` / `kubectl delete namespace`).

> Note: when Docker/Kubernetes are unavailable in local dev, provider falls back to `mock` mode with simulated shell metadata so product development can continue.

## Web terminal integration

The launch API returns:

- `terminal.shellToken` (placeholder token for your WS auth flow)
- `terminal.shellCommand` (provider command metadata)

Connect these values to your xterm.js/websocket gateway and map to `docker exec` or `kubectl exec`.

