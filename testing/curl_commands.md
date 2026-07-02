# Integration Testing Guide - Async Webhook Automation Engine

This guide provides the necessary details, script commands, and API requests to test features like Webhook Ingestion, Deduplication, Auth Isolation, Failed Actions, Worker Crash Recovery, and Failed Execution Replay.

---

## Prerequisites
Ensure the application stack is running:
- **Backend API:** `http://localhost:3000`
- **MongoDB:** `localhost:27017`
- **Redis:** `localhost:6379`
- **Active Tenant ID:** `60d5ec4a2f8fb814c8f8d9f1` (with API Key: `acme_apikey_xyz`)

---

## 1. Sending Webhook
Send a valid Stripe webhook event to trigger automation rules.

```bash
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "X-Tenant-ID: 60d5ec4a2f8fb814c8f8d9f1" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1672531199,v1=sig_stripe_valid" \
  -d '{
    "id": "evt_stripe_9999",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_3M3aeELkdIwHu7ix2",
        "amount": 7500,
        "currency": "usd",
        "customer": "cus_JaneDoe123"
      }
    }
  }'
```

---

## 2. Duplicate Webhook (Deduplication Check)
Send the exact same webhook payload twice. The first request will succeed with HTTP 200 and enqueue the job. The second request will return HTTP 200 but identify the event as a duplicate and bypass re-enqueuing.

```bash
# Run this command twice in succession
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "X-Tenant-ID: 60d5ec4a2f8fb814c8f8d9f1" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1672531199,v1=sig_stripe_duplicate" \
  -d '{
    "id": "evt_stripe_duplicate_1",
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_duplicate_1",
        "amount": 6000,
        "customer": "cus_JaneDoe123"
      }
    }
  }'
```

---

## 3. Invalid Webhook (Auth Isolation Check)
Send a webhook with an invalid or missing `X-Tenant-ID` header. The request should be rejected with a `403 Forbidden` response.

```bash
curl -i -X POST http://localhost:3000/api/webhooks/stripe \
  -H "X-Tenant-ID: invalid_tenant_id_value" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_stripe_unauthorized",
    "type": "payment_intent.succeeded",
    "data": { "amount": 1000 }
  }'
```

---

## 4. Failed Action Simulation
Trigger an automation rule containing an action configured to fail.
- **Rule Action 2 (GitHub opened issues alert email):** If the email destination recipient is set to `"fail"`, our mock email engine throws a fatal exception.

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "X-Tenant-ID: 60d5ec4a2f8fb814c8f8d9f1" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_github_failure_trigger",
    "type": "issues.opened",
    "issue": {
      "title": "SMTP failure trigger",
      "body": "This body is fine, but the handler will fail",
      "user": { "login": "fail" }
    }
  }'
```

---

## 5. Worker Crash Recovery Simulation
Simulate a worker crash during task execution. BullMQ will detect the stalled/crashed job, and our `@OnQueueEvent('failed')` listener will transition the database execution record status to `'failed'` cleanly.

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "X-Tenant-ID: 60d5ec4a2f8fb814c8f8d9f1" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "evt_github_crash_trigger",
    "type": "issues.opened",
    "issue": {
      "title": "Crash simulation",
      "body": "Forces process termination",
      "user": { "login": "crash" }
    }
  }'
```

---

## 6. Replay Failed Execution
Manually replay an execution that transitioned to the `'failed'` status. Replace `<EXECUTION_ID>` with the `_id` of the failed run.

```bash
curl -X POST http://localhost:3000/api/executions/<EXECUTION_ID>/replay \
  -H "X-Tenant-ID: 60d5ec4a2f8fb814c8f8d9f1" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Developer manual reprocessing trigger"
  }'
```
