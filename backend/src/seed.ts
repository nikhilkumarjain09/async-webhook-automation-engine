import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './tenant/schemas/tenant.schema';
import { AutomationRule, AutomationRuleDocument } from './rules/schemas/automation-rule.schema';
import { WebhookEvent, WebhookEventDocument } from './webhooks/schemas/webhook-event.schema';
import { Execution, ExecutionDocument } from './executions/schemas/execution.schema';

// ── Fixed ObjectIds so the frontend default always works ──────────────────
const ACME_ID   = new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f1');
const BETA_ID   = new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f2');

async function bootstrap() {
  console.log('\n🌱 Starting database seed...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const tenantModel    = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));
    const ruleModel      = app.get<Model<AutomationRuleDocument>>(getModelToken(AutomationRule.name));
    const eventModel     = app.get<Model<WebhookEventDocument>>(getModelToken(WebhookEvent.name));
    const executionModel = app.get<Model<ExecutionDocument>>(getModelToken(Execution.name));

    // ── 1. Tenants — upsert with pinned ObjectIds ─────────────────────────
    const tenantData = [
      {
        _id: ACME_ID,
        name: 'Acme Corporation',
        apiKey: 'acme_apikey_xyz',
        domain: 'acme.com',
        status: 'active',
        settings: { maxDailyExecutions: 10000, maxRules: 50, alertEmail: 'alerts@acme.com' },
      },
      {
        _id: BETA_ID,
        name: 'Beta Industries',
        apiKey: 'beta_apikey_abc',
        domain: 'beta.com',
        status: 'active',
        settings: { maxDailyExecutions: 5000, maxRules: 20, alertEmail: 'devs@beta.com' },
      },
    ];

    const seededTenants: Record<string, TenantDocument> = {};
    console.log('📦 Seeding tenants...');
    for (const data of tenantData) {
      // Find by pinned _id first; fall back to name so re-runs are idempotent
      let tenant = await tenantModel.findById(data._id).exec()
        ?? await tenantModel.findOne({ name: data.name }).exec();

      if (!tenant) {
        tenant = await tenantModel.create(data);
        console.log(`  ✅ Created: ${data.name} (${data._id.toHexString()})`);
      } else {
        // Ensure existing record carries the pinned _id (migrate if needed)
        if (tenant._id.toHexString() !== data._id.toHexString()) {
          console.log(`  ⚠️  ${data.name} exists but with a different _id (${tenant._id}). Using existing ID.`);
        } else {
          console.log(`  ℹ️  Already exists: ${data.name}`);
        }
      }
      seededTenants[data.name] = tenant;
    }

    const t1 = seededTenants['Acme Corporation'];
    const t2 = seededTenants['Beta Industries'];

    // ── 2. Automation Rules ───────────────────────────────────────────────
    const ruleData = [
      {
        tenantId: t1._id,
        name: 'High-Value Payment Slack Sync',
        description: 'Notify engineering Slack channel on Stripe charges exceeding $50.00',
        triggerSource: 'stripe',
        triggerEventType: 'payment_intent.succeeded',
        status: 'active',
        conditions: [{ field: 'payload.amount', operator: 'greaterThan', value: 5000 }],
        actions: [{
          order: 0, actionType: 'http_call',
          config: {
            url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXX',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { text: 'High value transaction: ${{payload.amount}}' },
          },
        }],
      },
      {
        tenantId: t1._id,
        name: 'GitHub Issue Email Alerts',
        description: 'Sends email notification when new issues are opened',
        triggerSource: 'github',
        triggerEventType: 'issues.opened',
        status: 'active',
        conditions: [],
        actions: [{
          order: 0, actionType: 'email_send',
          config: { to: 'alerts@acme.com', subject: 'New Issue: {{payload.issue.title}}', body: 'Opened by {{payload.issue.user.login}}' },
        }],
      },
      {
        tenantId: t2._id,
        name: 'Shopify Order Database Sync',
        description: 'Sync Shopify paid orders to external warehousing API',
        triggerSource: 'shopify',
        triggerEventType: 'orders.create',
        status: 'active',
        conditions: [{ field: 'payload.financial_status', operator: 'equals', value: 'paid' }],
        actions: [{
          order: 0, actionType: 'http_call',
          config: { url: 'https://api.beta-warehousing.com/v1/orders', method: 'POST', headers: { Authorization: 'Bearer beta_secret' }, body: { orderId: '{{payload.id}}' } },
        }],
      },
      {
        tenantId: t2._id,
        name: 'Slack Failure Logging',
        description: 'Log failed Shopify order events to Slack',
        triggerSource: 'shopify',
        triggerEventType: 'orders.failed',
        status: 'active',
        conditions: [],
        actions: [{
          order: 0, actionType: 'slack_notify',
          config: { channel: 'shopify-failures', text: 'Order failed: {{payload.id}}' },
        }],
      },
    ];

    const seededRules: Record<string, AutomationRuleDocument> = {};
    console.log('📦 Seeding automation rules...');
    for (const r of ruleData) {
      let rule = await ruleModel.findOne({ name: r.name, tenantId: r.tenantId }).exec();
      if (!rule) {
        rule = await ruleModel.create(r);
        console.log(`  ✅ Created: ${r.name}`);
      } else {
        console.log(`  ℹ️  Already exists: ${r.name}`);
      }
      seededRules[r.name] = rule;
    }

    // ── 3. Webhook Events ─────────────────────────────────────────────────
    const eventData = [
      {
        tenantId: t1._id,
        eventIdentifier: 'evt_stripe_1001',
        source: 'stripe',
        eventType: 'payment_intent.succeeded',
        payload: { amount: 6500, customer: 'cus_JaneDoe123', status: 'succeeded' },
        headers: { 'user-agent': 'Stripe/v1', 'x-stripe-signature': 'sig_12345' },
        status: 'completed',
        retryCount: 0,
        maxRetries: 5,
      },
      {
        tenantId: t1._id,
        eventIdentifier: 'evt_github_2002',
        source: 'github',
        eventType: 'issues.opened',
        payload: { issue: { title: 'Crash on boot', body: 'App crashes on startup', user: { login: 'janedoe' } } },
        headers: { 'user-agent': 'GitHub-Hookshot', 'x-github-event': 'issues' },
        status: 'failed',
        retryCount: 5,
        maxRetries: 5,
        error: 'SMTP Connection Timeout after 5 retries',
      },
      {
        tenantId: t2._id,
        eventIdentifier: 'evt_shopify_3003',
        source: 'shopify',
        eventType: 'orders.create',
        payload: { id: 998877, total_price: '150.00', financial_status: 'paid' },
        headers: { 'user-agent': 'Shopify Webhook' },
        status: 'completed',
        retryCount: 0,
        maxRetries: 5,
      },
    ];

    const seededEvents: Record<string, WebhookEventDocument> = {};
    console.log('📦 Seeding webhook events...');
    for (const ev of eventData) {
      let event = await eventModel.findOne({ eventIdentifier: ev.eventIdentifier, tenantId: ev.tenantId }).exec();
      if (!event) {
        event = await eventModel.create(ev);
        console.log(`  ✅ Created: ${ev.eventIdentifier}`);
      } else {
        console.log(`  ℹ️  Already exists: ${ev.eventIdentifier}`);
      }
      seededEvents[ev.eventIdentifier] = event;
    }

    // ── 4. Executions ─────────────────────────────────────────────────────
    const execData = [
      {
        tenantId: t1._id,
        ruleId: seededRules['High-Value Payment Slack Sync']._id,
        webhookEventId: seededEvents['evt_stripe_1001']._id,
        status: 'completed',
        retryCount: 0,
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3599100),
        durationMs: 900,
        steps: [{
          actionIndex: 0, actionType: 'http_call', status: 'success',
          requestPayload: { text: 'High value transaction: $6500' },
          responsePayload: { ok: true, channel: 'engineering' },
          durationMs: 900,
          executedAt: new Date(Date.now() - 3600000),
        }],
      },
      {
        tenantId: t1._id,
        ruleId: seededRules['GitHub Issue Email Alerts']._id,
        webhookEventId: seededEvents['evt_github_2002']._id,
        status: 'failed',
        retryCount: 5,
        startedAt: new Date(Date.now() - 7200000),
        completedAt: new Date(Date.now() - 7198800),
        durationMs: 1200,
        error: 'SMTP Connection Timeout after 5 retries',
        steps: [{
          actionIndex: 0, actionType: 'email_send', status: 'failed',
          error: 'SMTP Connection Timeout',
          requestPayload: { to: 'alerts@acme.com', subject: 'New Issue: Crash on boot' },
          responsePayload: null,
          durationMs: 1200,
          executedAt: new Date(Date.now() - 7200000),
        }],
      },
    ];

    console.log('📦 Seeding executions...');
    for (const ex of execData) {
      let execution = await executionModel.findOne({ webhookEventId: ex.webhookEventId }).exec();
      if (!execution) {
        await executionModel.create(ex);
        console.log(`  ✅ Created execution for event: ${ex.webhookEventId}`);
      } else {
        console.log(`  ℹ️  Already exists for event: ${ex.webhookEventId}`);
      }
    }

    // ── Summary ───────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ Seed Completed Successfully           ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  Acme Corporation  ID: ${t1._id}  ║`);
    console.log(`║  Beta Industries   ID: ${t2._id}  ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Use Acme ID in the frontend Tenant Context field    ║');
    console.log('╚══════════════════════════════════════════════════════╝\n');

  } catch (err) {
    console.error('\n❌ Seed failed:', err);
  } finally {
    await app.close();
  }
}

bootstrap().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
