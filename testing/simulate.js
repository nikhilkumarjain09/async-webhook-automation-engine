/**
 * Integration Test Simulator - Async Webhook Automation Engine
 * Runs fully automated test suites using native Node.js fetch APIs.
 */

const API_BASE = 'http://localhost:3000/api';
const DEFAULT_TENANT = '60d5ec4a2f8fb814c8f8d9f1';

async function logResponse(stepName, response) {
  console.log(`\n========================================`);
  console.log(`[TEST STEP] ${stepName}`);
  console.log(`Status: ${response.status} ${response.statusText}`);
  try {
    const data = await response.json();
    console.log('Body:', JSON.stringify(data, null, 2));
    return data;
  } catch {
    const text = await response.text();
    console.log('Body (text):', text);
    return text;
  }
}

async function run() {
  console.log('Starting Webhook Integration Tests...');

  // 1. Send Webhook
  const webhookRes = await fetch(`${API_BASE}/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': DEFAULT_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_${Date.now()}`,
          amount: 6000,
          customer: 'cus_JaneDoe123',
        },
      },
    }),
  });
  await logResponse('Send Valid Stripe Webhook', webhookRes);

  // 2. Duplicate Webhook
  const duplicateId = `evt_dup_${Date.now()}`;
  const payload = {
    id: duplicateId,
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: `pi_dup_${Date.now()}`,
        amount: 8000,
        customer: 'cus_JaneDoe123',
      },
    },
  };

  const dupRes1 = await fetch(`${API_BASE}/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': DEFAULT_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  await logResponse('Deduplication Check - Request 1 (Expect 200 Ingested)', dupRes1);

  const dupRes2 = await fetch(`${API_BASE}/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': DEFAULT_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const dupData2 = await logResponse('Deduplication Check - Request 2 (Expect 200 Duplicate Bypass)', dupRes2);

  // 3. Invalid Webhook Auth
  const authRes = await fetch(`${API_BASE}/webhooks/stripe`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': 'invalid_tenant_id_value_abc',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: `evt_auth_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: { amount: 1000 },
    }),
  });
  await logResponse('Invalid Tenant Authentication Isolation (Expect 403 Forbidden)', authRes);

  // 4. Simulate Action Failure
  const failRes = await fetch(`${API_BASE}/webhooks/github`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': DEFAULT_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: `evt_fail_${Date.now()}`,
      type: 'issues.opened',
      issue: {
        title: 'Action Failure Simulation',
        body: 'Handler will crash during SMTP mockup send',
        user: { login: 'fail' },
      },
    }),
  });
  await logResponse('Trigger Action Failure (Expect execution status transition to failed)', failRes);

  // 5. Simulate Worker Crash
  const crashRes = await fetch(`${API_BASE}/webhooks/github`, {
    method: 'POST',
    headers: {
      'X-Tenant-ID': DEFAULT_TENANT,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: `evt_crash_${Date.now()}`,
      type: 'issues.opened',
      issue: {
        title: 'Process Crash Simulation',
        body: 'Processor Stall / Job Crash',
        user: { login: 'crash' },
      },
    }),
  });
  await logResponse('Trigger Worker crash simulation (Expect BullMQ to retry or transition state)', crashRes);

  // 6. Replay Failed Execution
  console.log('\nWaiting for background execution records to index...');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\nFetching recent failed executions to trigger manual replay...');
  const execsRes = await fetch(`${API_BASE}/executions?status=failed&page=1&limit=1`, {
    headers: { 'X-Tenant-ID': DEFAULT_TENANT },
  });
  const execs = await execsRes.json();

  if (execs && execs.length > 0) {
    const failedExecId = execs[0]._id;
    console.log(`Found failed execution ID: ${failedExecId}`);
    
    const replayRes = await fetch(`${API_BASE}/executions/${failedExecId}/replay`, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': DEFAULT_TENANT,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Automated integration testing suite reprocess trigger',
      }),
    });
    await logResponse('Replay Failed Execution (Expect new replay log history created)', replayRes);
  } else {
    console.log('No failed execution found to replay. Try running Option 4 (Action Failure) again first.');
  }

  console.log('\n========================================');
  console.log('All Integration Tests Completed!');
}

run().catch((err) => console.error('Simulator runtime error:', err));
