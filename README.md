# Multi-Tenant Async Webhook Automation Engine

A high-performance, production-ready, multi-tenant Async Webhook Automation Engine built with **NestJS**, **TypeScript**, **MongoDB**, and **BullMQ/Redis**.

---

## 1. System Architecture

The engine uses a decoupled architecture where the API gateway ingestion layer and the worker processing layers communicate asynchronously via Redis queues.

```mermaid
graph TD
    Client([Outbound Providers / Client Devs]) -->|Ingest webhooks / API requests| Gateway[NestJS API Gateway Service]
    
    subgraph Ingestion Layer
        Gateway -->|Deduplication index lookup| Mongo[(MongoDB)]
        Gateway -->|Enqueue Jobs| Redis[(Redis Broker)]
    end

    subgraph Processing Layer (BullMQ Workers)
        Redis -->|Dequeue Jobs| Worker[Webhook Worker Processor]
        Worker -->|1. Validate rules & evaluate conditions| RulesEngine[Rules Engine Service]
        Worker -->|2. Sequentially execute steps| ActionsEngine[Actions Engine Service]
        Worker -->|3. Record Telemetry AuditLogs| Mongo
    end
    
    subgraph Client Dashboards
        Dashboard[Vite React Dashboard Client] -->|Query stats & trigger replays| Gateway
    end
```

---

## 2. Data Model & Schemas

### Tenants (`tenants` collection)
Enforces logical isolation boundaries across all queries.
```typescript
{
  _id: ObjectId,
  name: String,
  apiKey: String,
  domain: String,
  status: 'active' | 'inactive',
  settings: {
    maxDailyExecutions: Number,
    maxRules: Number,
    alertEmail: String
  }
}
```

### Webhook Events (`webhookevents` collection)
Stores incoming payloads. Enforces uniqueness using a compound index on `{ tenantId: 1, eventIdentifier: 1 }`.
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  eventIdentifier: String, // Deterministic hash of payload/signature
  source: String,          // e.g. 'stripe'
  eventType: String,       // e.g. 'payment_intent.succeeded'
  payload: Object,         // Raw payload
  headers: Object,         // Ingestion HTTP headers
  status: 'pending' | 'processing' | 'completed' | 'failed',
  retryCount: Number,
  maxRetries: Number,
  error: String
}
```

### Automation Rules (`automationrules` collection)
Rules containing match criteria and sequential steps.
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  name: String,
  description: String,
  triggerSource: String,
  triggerEventType: String,
  status: 'active' | 'inactive',
  conditions: [
    { field: String, operator: 'equals'|'contains'|'greaterThan', value: Any }
  ],
  actions: [
    { order: Number, actionType: 'http_call'|'email_send', config: Object }
  ]
}
```

### Executions (`executions` collection)
Tracks execution logs, retry counts, duration, and step-level state telemetry.
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  ruleId: ObjectId,
  webhookEventId: ObjectId,
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying',
  retryCount: Number,
  startedAt: Date,
  completedAt: Date,
  durationMs: Number,
  error: String,
  steps: [
    {
      actionIndex: Number,
      actionType: String,
      status: 'success' | 'failed',
      error: String,
      requestPayload: Object,
      responsePayload: Object,
      durationMs: Number,
      executedAt: Date
    }
  ]
}
```

### Replay History (`replayhistories` collection)
Audits manual replays.
```typescript
{
  _id: ObjectId,
  tenantId: ObjectId,
  webhookEventId: ObjectId,
  triggeredBy: String,
  reason: String,
  status: String
}
```

---

## 3. Queue Design

* **Broker:** Redis database served via `BullMQ`.
* **Queue Name:** `webhook-processing`
* **Concurrency:** Configured to `5` parallel workers per instance (scalable).
* **Job Lock Settings:**
  * `lockDuration: 30000ms` (30 seconds visibility timeout to prevent duplicate worker pickup).
  * `stalledInterval: 15000ms` (worker check frequency for crashed/dead lock holders).
  * `maxStalledCount: 1` (stalled jobs are immediately marked as failed to guarantee fast recovery).

---

## 4. Webhook Processing Flow

1. **Ingest Gateway:** Enforces tenant existence validation.
2. **Deduplication:** Computes a deterministic payload hash. Attempts to insert to MongoDB. If MongoDB returns error code `11000` (duplicate key), ingestion returns HTTP 200 immediately, bypassing the BullMQ queue.
3. **Queue Enqueue:** A BullMQ background job is spawned.
4. **Worker Dequeue:**
   * Checks if an execution is already in progress.
   * **Rule Matching:** Evaluates the webhook event against active tenant rules.
   * **Conditions Check:** Evaluates logic operator parameters (`equals`, `contains`, `greaterThan`).
   * **Steps Execution Loop:** Executes actions sequentially.
     * Checks if a step was already successfully executed in a previous attempt (for replays) to maintain **idempotency**.
     * Logs response telemetry.

---

## 5. Failure Handling & Crash Recovery

### Exception Types
1. **`RetryableActionException`:** Thrown on transient failures (e.g. HTTP 503, connection timeouts). BullMQ intercepts this and triggers an exponential backoff retry.
2. **`NonRetryableActionException`:** Thrown on configuration or client errors (e.g. HTTP 400 Bad Request, missing configurations). The job calls `await job.discard()`, halts further retries, and transitions the execution state to `'failed'` immediately.

### Worker Crash Recovery
If a worker crashes/reboots mid-execution:
1. BullMQ's stalled job manager detects the lost lock after `lockDuration` (30s) expires.
2. The queue listener (`@OnQueueEvent('failed')`) catches the failed job.
3. The listener updates the database state: the execution and webhook event statuses are transitioned from `'processing'` to `'failed'`, ensuring no jobs are silently lost or left permanently in `'processing'`.

---

## 6. Failed Execution Replay Flow

We expose a REST endpoint `POST /api/executions/:id/replay`.
* **Constraint:** Replay is only permitted for executions with a `'failed'` status.
* **Original Payload Reuse:** Fetches the original webhook event data and triggers a new BullMQ job.
* **Step-Level Resume:** During the execution loop, the worker checks the previous execution steps trace. Steps that already finished with status `'success'` are skipped (safeguarding against double billing or duplicate external side effects), and only failed or unexecuted steps are run.

---

## 7. How to Run

### Option A: Complete Docker Compose (Recommended)
Boot up the backend, frontend, MongoDB, and Redis with one command:
```bash
docker-compose up --build
```
* **Frontend Dashboard:** `http://localhost:8080`
* **Backend API Gateway:** `http://localhost:3000/api`

### Option B: Local Development
Ensure local MongoDB and Redis instances are running, then run:

**1. Backend:**
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

**2. Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 8. How to Test & Seed

### Seeding Data
To populate the database with mock records (2 Tenants, rules, events, failed/success runs):
```bash
npm --prefix backend run db:seed
```

### Integration Testing Simulator
We provide an automated testing script that validates all pathways:
```bash
node testing/simulate.js
```
Review the [Integration Testing Guide](file:///e:/automation_engine/testing/curl_commands.md) for raw `curl` commands and import the [Postman Collection](file:///e:/automation_engine/testing/postman_collection.json) for manual API validation.

---

## 9. Scaling Discussion

For a production environment handling millions of webhooks daily:

1. **Horizontal Worker Scaling:**
   We can separate the API ingestion layer and worker processing layer into independent containers. The API layer remains lightweight (express/nest routes only enqueuing jobs to Redis), while the worker processor runs on an auto-scaled container group (ECS/K8s) based on queue lag and CPU metrics.
2. **Redis & BullMQ Partitioning:**
   BullMQ can leverage Redis Cluster mode. We can partition queues using Tenant ID hashing to ensure heavy tenants do not block other tenants' jobs (Fair Queueing).
3. **Database Sharding:**
   Configure MongoDB sharding with the shard key set to `{ tenantId: 1, createdAt: 1 }` to isolate database reads/writes per tenant and speed up time-series queries.
4. **Idempotency Key Cache:**
   Move unique event checks (deduplication) to a Redis bloom filter or Redis key set with a TTL (e.g. 24 hours) for sub-millisecond deduplication checks prior to hitting MongoDB.

---

## 10. Production Assumptions

1. **API Security:** The current implementation uses a tenant header validation stub (`TenantGuard`). In production, this should be integrated with an API gateway (e.g., Kong, AWS API Gateway) or JWT-based API key validations.
2. **State Cleanup:** Webhook event logs and executions are write-heavy. A production deployment should configure MongoDB TTL indexes on `createdAt` (e.g., 30-day retention) or archive logs to cold storage (e.g., AWS S3).
3. **Idempotency limits:** The current step-level skip assumes step parameters are deterministic. Actions must be designed to handle replays gracefully.
