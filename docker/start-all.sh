#!/usr/bin/env bash
set -euo pipefail

cd /app

echo "Starting AI backend on :8001"
python3 -m uvicorn --app-dir "AI Backend" main:app --host 0.0.0.0 --port 8001 &
AI_PID=$!

echo "Starting Node backend on :3000"
node Backend/server.js &
NODE_PID=$!

shutdown() {
  echo "Shutting down services..."
  kill -TERM "$AI_PID" "$NODE_PID" 2>/dev/null || true
}

trap shutdown SIGINT SIGTERM
wait -n "$AI_PID" "$NODE_PID"
shutdown
