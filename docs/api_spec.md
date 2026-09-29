# OpsMind AI - API Specification

Base URL: `http://localhost:8000`

---

## 1. Incidents Endpoints

### `POST /api/incidents`
Creates a new incident.

**Request Body**:
```json
{
  "title": "API Latency Spike on checkout-api after deployment",
  "service": "checkout-api",
  "severity": "SEV1",
  "environment": "production",
  "description": "p99 latency spiked from 120ms to 4800ms. Endpoints failing with HTTP 504.",
  "symptoms": ["p99 latency >4.8s", "HikariCP pool saturation 50/50"],
  "logs": "com.zaxxer.hikari.pool.HikariPool - Connection is not available, request timed out after 30005ms."
}
```

### `POST /api/incidents/{id}/analyze`
Runs the 5-agent investigation pipeline.

**Request Body**:
```json
{
  "mode": "hindsight"
}
```

### `POST /api/incidents/{id}/action`
Submits human-in-the-loop decision for an action.

**Request Body**:
```json
{
  "action_id": "INC-8401_act_pool_2",
  "action_type": "approve",
  "notes": "Verified replica lag is <1s before rollback"
}
```

### `POST /api/incidents/{id}/resolve`
Marks incident as resolved.

**Request Body**:
```json
{
  "root_cause": "Unindexed query in release holding connection pool locks",
  "resolution": "Rolled back deployment to previous stable revision and expanded pool size to 100",
  "resolved_by": "Lead SRE"
}
```

### `POST /api/incidents/{id}/feedback`
Submits engineer feedback and triggers Agent 5 (Learning Agent).

**Request Body**:
```json
{
  "rating": 5,
  "feedback_text": "Rollback worked in under 4 minutes. Do not restart pods without rollback.",
  "was_recommendation_helpful": true
}
```

---

## 2. Memory Endpoints

- `GET /api/memory/stats` - Returns telemetry on Hindsight memory layers.
- `GET /api/memory/search?q=checkout` - Queries facts across memory banks.
- `POST /api/memory/seed` - Seeds enterprise incidents and runbooks.
- `POST /api/memory/reset` - Resets memory state to clean baseline.

---

## 3. Learning Evolution & Demo Endpoints

- `GET /api/learning/evolution` - Telemetry for the 4 progression milestones and MTTR reduction curve.
- `GET /api/learning/comparison` - Side-by-side comparison for Stateless Mode vs Hindsight Mode.
- `POST /api/demo/run-step/{step}` - Runs a specific demo step (1 to 5).
- `POST /api/demo/full-scenario` - Executes the complete 60s demonstration scenario.
