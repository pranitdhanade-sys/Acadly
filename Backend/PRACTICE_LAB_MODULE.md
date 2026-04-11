# Practice Lab Module (Node.js)

## Folder structure

```text
Backend/
  questions/
    docker/
      fundamentals.json
    kubernetes/
      workloads.yaml
  modules/
    practice-lab/
      adaptive-engine.js
      evaluator.js
      history-store.js
      question-loader.js
      test-generator.js
  data/
    practice-lab-history.json
  routes/
    practicelab.js
```

## Sample question schema

```json
{
  "id": "docker-easy-1",
  "prompt": "Which Docker command lists running containers?",
  "topic": "Docker",
  "difficulty": "easy",
  "type": "mcq",
  "tags": ["docker", "cli"],
  "options": ["docker ps", "docker images", "docker ls", "docker inspect"],
  "correctAnswer": "docker ps",
  "explanation": "docker ps shows active containers.",
  "weight": 1,
  "coding": {
    "language": "javascript",
    "functionName": "addNumbers",
    "starterCode": "function addNumbers(a,b){ }",
    "testCases": [
      {
        "description": "adds positive numbers",
        "input": [2, 3],
        "expectedOutput": 5
      }
    ]
  }
}
```

## Test generation algorithm

1. Load all questions recursively from `Backend/questions` (`.json/.yaml/.yml`).
2. Apply filters for topics.
3. Compute target counts per difficulty from requested distribution.
4. Randomly sample each difficulty bucket first.
5. Fill remaining slots from leftover pool.
6. Shuffle final set.
7. Shuffle MCQ options before returning.
8. Ensure no duplicate IDs inside a generated test.

## API endpoints

- `GET /api/practice-lab/questions`
  - Query filters: `topic`, `difficulty`, `type`, `tags`
  - Returns question metadata.

- `POST /api/practice-lab/generate-test`
  - Body:
    - `questionCount`
    - `difficultyDistribution` (example `{ "easy": 0.3, "medium": 0.4, "hard": 0.3 }`)
    - `topics` (string array)
    - `timed` (boolean)
    - `durationMinutes`
    - `userId`
  - Returns randomized test, `testId`, and timer metadata.

- `POST /api/practice-lab/evaluate`
  - Body:
    - `testId`
    - `answers` (`[{ questionId, answer }]`)
    - `userId`
  - Evaluates MCQ + basic coding answers, applies weighted scoring, and returns explanations.

- `GET /api/practice-lab/history/:userId`
  - Returns full attempt history.

- `GET /api/practice-lab/analytics/:userId`
  - Returns aggregates for dashboard (attempts, average score, topic breakdown).

## Example implementation flow

1. Instructor adds new files under `Backend/questions/<topic>/...` with schema fields.
2. Student calls `generate-test` with topics and difficulty mix.
3. Backend creates test session, randomizes questions/options, and enforces no repetition.
4. Student submits answers.
5. Backend evaluates:
   - MCQ: exact option match
   - Coding: runs function against basic test cases
6. Backend stores attempt in `Backend/data/practice-lab-history.json`.
7. Backend returns:
   - Weighted score
   - Per-question feedback + explanation
   - Adaptive next difficulty suggestion (`easy/medium/hard`)

## Bonus coverage

- Adaptive testing: `adaptive-engine.js` computes next difficulty based on score.
- Timed tests: `generate-test` can set `expiresAt`; expired submissions are rejected.
- Analytics dashboard support: `/analytics/:userId` endpoint returns aggregates.


## Frontend wiring (`Frontend/practicallab.html`)

1. On load, frontend calls `GET /api/practice-lab/questions` and builds topic checkboxes dynamically.
2. Clicking **Generate Test** sends `POST /api/practice-lab/generate-test` with:
   - `questionCount`
   - selected `topics`
   - `difficultyDistribution` ratios
   - `timed` + `durationMinutes`
   - `userId`
3. Backend returns `testId`, randomized questions, and optional `expiresAt`.
4. Frontend renders question UI by type:
   - `mcq` => radio options
   - `coding` => starter-code textarea
   - `descriptive` => plain textarea
5. Clicking **Submit Answers** sends `POST /api/practice-lab/evaluate` with `{ testId, userId, answers[] }`.
6. Result panel shows weighted summary, per-question feedback, explanations, and adaptive recommendation.
7. **Load History** and **Load Analytics** call:
   - `GET /api/practice-lab/history/:userId`
   - `GET /api/practice-lab/analytics/:userId`
