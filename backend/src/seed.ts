import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './tenant/schemas/tenant.schema';
import { AutomationRule, AutomationRuleDocument } from './rules/schemas/automation-rule.schema';
import { WebhookEvent, WebhookEventDocument } from './webhooks/schemas/webhook-event.schema';
import { Execution, ExecutionDocument } from './executions/schemas/execution.schema';
import { ReplayHistory, ReplayHistoryDocument } from './webhooks/schemas/replay-history.schema';

// ── 10 Pinned Tenant ObjectIds ──────────────────────────────────────────────
const DEMO_TENANT_IDS = [
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f1'), // Acme Corporation
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f2'), // Beta Industries
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f3'), // Gamma Services
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f4'), // Delta Tech
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f5'), // Epsilon Logistics
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f6'), // Zeta Finance
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f7'), // Eta Media
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f8'), // Theta Health
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f9'), // Iota Energy
  new Types.ObjectId('60d5ec4a2f8fb814c8f8d9fa'), // Kappa Retail
];

const TENANT_NAMES = [
  'Acme Corporation',
  'Beta Industries',
  'Gamma Services',
  'Delta Tech',
  'Epsilon Logistics',
  'Zeta Finance',
  'Eta Media',
  'Theta Health',
  'Iota Energy',
  'Kappa Retail',
];

const TENANT_DOMAINS = [
  'acme.com',
  'betaindustries.com',
  'gammaservices.com',
  'deltatech.io',
  'epsilonlogistics.com',
  'zetafinance.com',
  'etamedia.co',
  'thetahealth.org',
  'iotaenergy.net',
  'kapparetail.com',
];

// ── Sources & Event Types ───────────────────────────────────────────────────
const SOURCES = ['shopify', 'stripe', 'hubspot', 'salesforce', 'custom_api'];

// Map of event type labels to values
const EVENT_TYPES = [
  'order_created',
  'order_updated',
  'payment_failed',
  'refund_issued',
  'customer_created',
  'deal_updated',
  'invoice_paid',
  'subscription_cancelled',
  'inventory_updated',
  'shipment_delivered',
];

// Triggers mapping for the 30 rules (some triggers appear twice to create 2-rule matches)
// We define 15 trigger pairs (each pair has the same trigger, total 30 rules)
const RULE_TEMPLATES = [
  // Pair 0
  { name: 'Shopify Slack Notification for High Value Orders', triggerSource: 'shopify', triggerEventType: 'order_created' },
  { name: 'Shopify Lead Sync to HubSpot', triggerSource: 'shopify', triggerEventType: 'order_created' },
  // Pair 1
  { name: 'Stripe Failed Payment Alert Email', triggerSource: 'stripe', triggerEventType: 'payment_failed' },
  { name: 'Stripe Auto-Retry Billing Logic', triggerSource: 'stripe', triggerEventType: 'payment_failed' },
  // Pair 2
  { name: 'Stripe Refund Customer CRM Sync', triggerSource: 'stripe', triggerEventType: 'refund_issued' },
  { name: 'Stripe Refund Ledger accounting entries', triggerSource: 'stripe', triggerEventType: 'refund_issued' },
  // Pair 3
  { name: 'HubSpot Deal Won Finance Notification', triggerSource: 'hubspot', triggerEventType: 'deal_updated' },
  { name: 'HubSpot Deal Stage Slack Logger', triggerSource: 'hubspot', triggerEventType: 'deal_updated' },
  // Pair 4
  { name: 'Salesforce New Lead Slack Notification', triggerSource: 'salesforce', triggerEventType: 'customer_created' },
  { name: 'Salesforce Account Initialization Sync', triggerSource: 'salesforce', triggerEventType: 'customer_created' },
  // Pair 5
  { name: 'Custom API Order Ingestion Sync', triggerSource: 'custom_api', triggerEventType: 'order_created' },
  { name: 'Custom API Order Analytics Tracker', triggerSource: 'custom_api', triggerEventType: 'order_created' },
  // Pair 6
  { name: 'Shopify Inventory Alert Threshold', triggerSource: 'shopify', triggerEventType: 'inventory_updated' },
  { name: 'Shopify Inventory Auto-reorder Action', triggerSource: 'shopify', triggerEventType: 'inventory_updated' },
  // Pair 7
  { name: 'Shopify Shipment Delivered Email Notify', triggerSource: 'shopify', triggerEventType: 'shipment_delivered' },
  { name: 'Shopify Shipment CRM Fulfilled Updater', triggerSource: 'shopify', triggerEventType: 'shipment_delivered' },
  // Pair 8
  { name: 'Stripe Subscription Cancelled Account Revoke', triggerSource: 'stripe', triggerEventType: 'subscription_cancelled' },
  { name: 'Stripe Subscription Churn Logger', triggerSource: 'stripe', triggerEventType: 'subscription_cancelled' },
  // Pair 9
  { name: 'Stripe Invoice Paid Accounting Ledger Sync', triggerSource: 'stripe', triggerEventType: 'invoice_paid' },
  { name: 'Stripe Invoice Payment Customer Thankyou', triggerSource: 'stripe', triggerEventType: 'invoice_paid' },
  // Pair 10
  { name: 'Shopify Order Updated Inventory Auditor', triggerSource: 'shopify', triggerEventType: 'order_updated' },
  { name: 'Shopify Order Updated ERP Sync Task', triggerSource: 'shopify', triggerEventType: 'order_updated' },
  // Pair 11
  { name: 'Custom API System Heartbeat Watchdog', triggerSource: 'custom_api', triggerEventType: 'payment_failed' },
  { name: 'Custom API Incident Handler Logger', triggerSource: 'custom_api', triggerEventType: 'payment_failed' },
  // Pair 12
  { name: 'Salesforce Opportunity Closed Sync', triggerSource: 'salesforce', triggerEventType: 'deal_updated' },
  { name: 'Salesforce Opportunity stage changed notification', triggerSource: 'salesforce', triggerEventType: 'deal_updated' },
  // Pair 13
  { name: 'Shopify Customer Created Welcome Email Flow', triggerSource: 'shopify', triggerEventType: 'customer_created' },
  { name: 'Shopify Customer Created Loyalty Profile Init', triggerSource: 'shopify', triggerEventType: 'customer_created' },
  // Pair 14
  { name: 'Stripe Charge Disputed Urgency Alert', triggerSource: 'stripe', triggerEventType: 'payment_failed' },
  { name: 'Stripe Charge Dispute Slack Notification', triggerSource: 'stripe', triggerEventType: 'payment_failed' },
];

// Failures list
const FAILURE_REASONS = [
  'HTTP 500 Internal Server Error: Gateway timeout from downstream host.',
  'Network Timeout: ETIMEDOUT after 10000ms trying to connect to slack.com api.',
  'Invalid API Signature: Hmac verification failed. Signature was malformed or expired.',
  'SMTP Connection Timeout: Connection lost while communicating with mailserver.',
  'Validation Error: Payload failed scheme check. SKU field is empty or missing.',
  'HTTP 403 Forbidden: API credentials revoked or scope insufficient.',
  'Database Exception: Transaction deadlocked on remote update.',
  'Rate Limit Exceeded: HTTP 429 Too Many Requests. Backoff recommended.',
  'Job cancelled by user request: Manual termination via Autoshield console.',
  'Execution terminated: Worker service crashed mid-run.',
];

// Helper to generate a random date in last 90 days
function getRandomDateInPast90Days(): Date {
  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);
  const timeDiff = now.getTime() - ninetyDaysAgo.getTime();
  const randomTime = ninetyDaysAgo.getTime() + Math.random() * timeDiff;
  return new Date(randomTime);
}

// Generate realistic payload based on eventType
function getRealisticPayload(eventType: string, index: number): Record<string, any> {
  const seedNum = index + 1000;
  switch (eventType) {
    case 'order_created':
      return {
        id: `ord_shopify_${seedNum}`,
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        currency: 'USD',
        customer: { email: `user_${seedNum}@example.com`, name: `Customer ${seedNum}` },
        items: [{ sku: `SKU-${seedNum}`, price: 49.99, quantity: Math.floor(Math.random() * 3) + 1 }],
      };
    case 'order_updated':
      return {
        id: `ord_shopify_${seedNum}`,
        status: Math.random() > 0.5 ? 'fulfilled' : 'processing',
        tracking_number: `1Z999AA101${seedNum}4729`,
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      };
    case 'payment_failed':
      return {
        id: `ch_stripe_${seedNum}`,
        amount: parseFloat((Math.random() * 100 + 5).toFixed(2)),
        failure_code: Math.random() > 0.5 ? 'insufficient_funds' : 'card_declined',
        failure_message: 'The card has expired or lacks funds.',
        customer_email: `payer_${seedNum}@example.com`,
      };
    case 'refund_issued':
      return {
        id: `re_stripe_${seedNum}`,
        charge_id: `ch_stripe_${seedNum}`,
        amount: parseFloat((Math.random() * 50).toFixed(2)),
        reason: 'requested_by_customer',
      };
    case 'customer_created':
      return {
        id: `cus_crm_${seedNum}`,
        email: `lead_${seedNum}@gmail.com`,
        first_name: `Alice_${seedNum}`,
        last_name: 'Smith',
      };
    case 'deal_updated':
      return {
        deal_id: `deal_hs_${seedNum}`,
        deal_name: `Enterprise Contract #${seedNum}`,
        stage: Math.random() > 0.5 ? 'Closed Won' : 'Presentation',
        amount: Math.floor(Math.random() * 90000) + 10000,
      };
    case 'invoice_paid':
      return {
        invoice_id: `inv_stripe_${seedNum}`,
        amount_paid: parseFloat((Math.random() * 300 + 15).toFixed(2)),
        pdf_url: `https://stripe.com/pdf/inv_${seedNum}.pdf`,
      };
    case 'subscription_cancelled':
      return {
        subscription_id: `sub_stripe_${seedNum}`,
        ended_at: Math.floor(Date.now() / 1000),
        reason: 'cancellation_requested',
      };
    case 'inventory_updated':
      return {
        sku: `SKU-${seedNum}-BLUE`,
        previous_quantity: Math.floor(Math.random() * 100),
        new_quantity: Math.floor(Math.random() * 10),
        warehouse: 'US-EAST-1',
      };
    case 'shipment_delivered':
      return {
        tracking_number: `1Z999AA101${seedNum}4729`,
        carrier: 'UPS',
        delivered_at: new Date().toISOString(),
        signature_required: false,
      };
    default:
      return {
        event_id: `evt_custom_${seedNum}`,
        status: 'ok',
        metadata: { source: 'custom_agent', version: '2.0.4' },
      };
  }
}

// Generate headers based on source
function getRealisticHeaders(source: string, index: number): Record<string, string> {
  const seedNum = index + 5000;
  if (source === 'stripe') {
    return {
      'user-agent': 'Stripe/v1 CraftWebhooks',
      'x-stripe-signature': `t=17829384,v1=sha256_${seedNum}abcde...`,
      'content-type': 'application/json',
    };
  } else if (source === 'shopify') {
    return {
      'user-agent': 'Shopify/Webhook',
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': `hmac_${seedNum}xyz...`,
    };
  } else if (source === 'hubspot') {
    return {
      'user-agent': 'Hubspot-Webhook-Ingress',
      'x-hubspot-signature': `hub_sig_${seedNum}`,
    };
  } else if (source === 'salesforce') {
    return {
      'user-agent': 'Salesforce-Apex-Callout',
      'x-salesforce-signature': `sf_sig_${seedNum}`,
    };
  } else {
    return {
      'user-agent': 'Axios/1.6.2',
      'authorization': `Bearer token_val_${seedNum}`,
    };
  }
}

async function bootstrap() {
  console.log('\n🚀 Starting comprehensive, enterprise database seed...');
  console.log('Resolving NestJS Application context...');
  
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    console.log('Resolving Mongoose models...');
    const tenantModel = app.get<Model<TenantDocument>>(getModelToken(Tenant.name));
    const ruleModel = app.get<Model<AutomationRuleDocument>>(getModelToken(AutomationRule.name));
    const eventModel = app.get<Model<WebhookEventDocument>>(getModelToken(WebhookEvent.name));
    const executionModel = app.get<Model<ExecutionDocument>>(getModelToken(Execution.name));
    const replayModel = app.get<Model<ReplayHistoryDocument>>(getModelToken(ReplayHistory.name));

    // ── 0. Clean Up Existing Demo Records ────────────────────────────────────
    console.log(`Cleaning up existing database records for the 10 demo tenants...`);
    await tenantModel.deleteMany({
      $or: [
        { _id: { $in: DEMO_TENANT_IDS } },
        { name: { $in: TENANT_NAMES } },
      ],
    }).exec();
    await ruleModel.deleteMany({ tenantId: { $in: DEMO_TENANT_IDS } }).exec();
    await eventModel.deleteMany({ tenantId: { $in: DEMO_TENANT_IDS } }).exec();
    await executionModel.deleteMany({ tenantId: { $in: DEMO_TENANT_IDS } }).exec();
    await replayModel.deleteMany({ tenantId: { $in: DEMO_TENANT_IDS } }).exec();
    console.log('Cleanup completed successfully.');

    // ── 1. Seed 10 Tenants ───────────────────────────────────────────────────
    console.log('\nSeeding 10 Tenants...');
    const tenants: TenantDocument[] = [];
    for (let i = 0; i < 10; i++) {
      const tenantId = DEMO_TENANT_IDS[i];
      const name = TENANT_NAMES[i];
      const domain = TENANT_DOMAINS[i];
      const apiKey = `key_demo_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i}`;
      
      const tDoc = await tenantModel.create({
        _id: tenantId,
        name,
        apiKey,
        domain,
        status: 'active',
        settings: {
          maxDailyExecutions: (i + 1) * 10000,
          maxRules: 100,
          alertEmail: `alerts@${domain}`,
        },
      });
      tenants.push(tDoc);
      console.log(`  ✅ Created Tenant: ${name} (${tenantId.toHexString()})`);
    }

    // ── 2. Seed 300 Automation Rules (30 per tenant) ──────────────────────────
    console.log('\nSeeding 300 Automation Rules (30 per tenant)...');
    const rulesByTenant: Record<string, any[]> = {};
    const rulesToInsert: any[] = [];

    // Pre-create rules structure for all 10 tenants
    for (let t = 0; t < 10; t++) {
      const tenant = tenants[t];
      const tenantRules: any[] = [];
      rulesByTenant[tenant._id.toHexString()] = [];

      for (let r = 0; r < 30; r++) {
        const template = RULE_TEMPLATES[r % 15]; // Use the 15 trigger pairs
        const ruleId = new Types.ObjectId();

        const ruleCondition = r % 3 === 0 ? [
          { field: 'payload.amount', operator: 'greaterThan', value: 100 },
        ] : r % 3 === 1 ? [
          { field: 'payload.status', operator: 'equals', value: 'paid' },
        ] : [];

        // Actions: http_call, slack_notify, email_send, db_operation
        const actTypes = ['http_call', 'slack_notify', 'email_send', 'db_operation'];
        const actions = [
          {
            order: 0,
            actionType: actTypes[r % 4],
            config: (actTypes[r % 4] === 'http_call' ? {
              url: `https://api.external-system.com/webhook/endpoint_${r}`,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: { event: '{{eventType}}', source: '{{source}}', original_id: '{{payload.id}}' },
            } : actTypes[r % 4] === 'email_send' ? {
              to: `recipient_${r}@example.com`,
              subject: 'Autoshield Event Alert',
              body: 'A workflow rule triggered this mock email alert.',
            } : actTypes[r % 4] === 'slack_notify' ? {
              channel: `channel-log-${r}`,
              text: 'Autoshield notification: Webhook trigger processed.',
            } : {
              operation: 'upsert',
              table: `data_sync_table_${r}`,
            }) as any,
          },
        ];

        // 20% of rules have 2 action steps
        if (r % 5 === 0) {
          actions.push({
            order: 1,
            actionType: actTypes[(r + 1) % 4],
            config: { note: 'Secondary cascading workflow step' } as any,
          });
        }

        const ruleData = {
          _id: ruleId,
          tenantId: tenant._id,
          name: `${template.name} - Rule #${r + 1}`,
          description: `Automatically routes triggers from ${template.triggerSource} for event types ${template.triggerEventType}.`,
          triggerSource: template.triggerSource,
          triggerEventType: template.triggerEventType,
          conditions: ruleCondition,
          actions,
          status: Math.random() > 0.08 ? 'active' : 'inactive', // ~92% active
        };

        rulesToInsert.push(ruleData);
        tenantRules.push(ruleData);
      }
    }

    const insertedRules = await ruleModel.insertMany(rulesToInsert);
    console.log(`  ✅ Successfully bulk seeded ${insertedRules.length} Automation Rules.`);

    // Group the inserted rules by tenant for quick referencing
    for (const rule of insertedRules) {
      rulesByTenant[rule.tenantId.toString()].push(rule);
    }

    // ── 3. Seed 5,000 Webhook Events & 8,000 Executions ───────────────────────
    console.log('\nGenerating 5,000 Webhook Events and 8,000 Executions...');
    const webhooksToInsert: any[] = [];
    const executionsToInsert: any[] = [];

    // Helper map of generated webhooks to match during execution insertion
    const webhooksByTenant: Record<string, any[]> = {};

    for (let t = 0; t < 10; t++) {
      const tenant = tenants[t];
      const tenantRules = rulesByTenant[tenant._id.toHexString()];
      webhooksByTenant[tenant._id.toHexString()] = [];

      // 500 webhooks per tenant
      // Webhooks 0-299 match 2 rules (generates 600 executions)
      // Webhooks 300-499 match 1 rule (generates 200 executions)
      // Total webhooks = 500. Total executions = 800.
      for (let w = 0; w < 500; w++) {
        const webhookId = new Types.ObjectId();
        const createdDate = getRandomDateInPast90Days();

        let chosenRules: AutomationRuleDocument[] = [];
        if (w < 300) {
          // Trigger 2 rules. Pair rules: (w % 15)*2 and (w % 15)*2 + 1
          const pairIdx = w % 15;
          const r1 = tenantRules[pairIdx * 2];
          const r2 = tenantRules[pairIdx * 2 + 1];
          chosenRules = [r1, r2];
        } else {
          // Trigger 1 rule. Pick rule (w % 30)
          const r1 = tenantRules[w % 30];
          chosenRules = [r1];
        }

        // Webhook details are based on the trigger of the chosen rule(s)
        const primaryRule = chosenRules[0];
        const source = primaryRule.triggerSource;
        const eventType = primaryRule.triggerEventType;
        const eventIdentifier = `evt_${source}_${tenant._id.toString().slice(-4)}_${w}_${Math.floor(Math.random() * 100000)}`;

        // Webhook status determines overall result (let's set later based on executions or randomly)
        // Let's generate executions first, then set the webhook status to match
        // Distribution of execution statuses for the 800 executions:
        // Completed: 680, Failed: 80, Retrying: 24, Processing: 8, Queued: 8
        // Let's map executions per webhook:
        // We will generate executions for chosenRules.
        const webhookStatus = 'pending'; // will update below
        
        const payloadObj = getRealisticPayload(eventType, w);
        const headersObj = getRealisticHeaders(source, w);

        const webhookData = {
          _id: webhookId,
          tenantId: tenant._id,
          eventIdentifier,
          source,
          eventType,
          payload: payloadObj,
          headers: new Map(Object.entries(headersObj)),
          status: webhookStatus,
          retryCount: 0,
          maxRetries: 5,
          createdAt: createdDate,
          updatedAt: createdDate,
        };

        webhooksToInsert.push(webhookData);
        webhooksByTenant[tenant._id.toHexString()].push({
          webhookData,
          chosenRules,
        });
      }
    }

    // Now construct the 8,000 executions (800 per tenant)
    // We also map and balance the execution statuses perfectly
    for (let t = 0; t < 10; t++) {
      const tenant = tenants[t];
      const webhookList = webhooksByTenant[tenant._id.toHexString()];

      // Execution status counts for this tenant:
      // completed: 680, failed: 80, retrying: 24, processing: 8, queued: 8
      const statusList: string[] = [];
      for (let i = 0; i < 680; i++) statusList.push('completed');
      for (let i = 0; i < 80; i++) statusList.push('failed');
      for (let i = 0; i < 24; i++) statusList.push('retrying');
      for (let i = 0; i < 8; i++) statusList.push('processing');
      for (let i = 0; i < 8; i++) statusList.push('queued');

      // Shuffle status list randomly to distribute them across webhooks
      for (let i = statusList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [statusList[i], statusList[j]] = [statusList[j], statusList[i]];
      }

      let execCounter = 0;

      // Loop through all 500 webhooks to assign their executions
      for (let w = 0; w < 500; w++) {
        const { webhookData, chosenRules } = webhookList[w];
        const webhookExecutions: any[] = [];

        for (const rule of chosenRules) {
          const status = statusList[execCounter++];
          const execId = new Types.ObjectId();
          const startedAt = new Date(webhookData.createdAt.getTime() + Math.random() * 5000); // starts 0-5s after webhook
          
          let durationMs = 0;
          let completedAt: Date | undefined = undefined;
          let errorMsg: string | undefined = undefined;
          let retryCount = 0;
          const steps: any[] = [];

          if (status === 'completed') {
            durationMs = Math.floor(Math.random() * 2000) + 50;
            completedAt = new Date(startedAt.getTime() + durationMs);
            // Simulate steps matching rule's actions
            rule.actions.forEach((act: any, idx: number) => {
              steps.push({
                actionIndex: idx,
                actionType: act.actionType,
                status: 'success',
                requestPayload: { target: act.config?.url || act.config?.to || 'db_operation', triggered: true },
                responsePayload: { status: 'success', code: 200, executionTimeMs: durationMs / rule.actions.length },
                durationMs: Math.floor(durationMs / rule.actions.length),
                executedAt: new Date(startedAt.getTime() + (idx * (durationMs / rule.actions.length))),
              });
            });
          } else if (status === 'failed') {
            durationMs = Math.floor(Math.random() * 1500) + 10;
            completedAt = new Date(startedAt.getTime() + durationMs);
            errorMsg = FAILURE_REASONS[execId.getTimestamp().getTime() % FAILURE_REASONS.length];
            retryCount = Math.floor(Math.random() * 4) + 2; // Failed after multiple attempts

            // Fails on step 1 (actionIndex 0)
            steps.push({
              actionIndex: 0,
              actionType: rule.actions[0].actionType,
              status: 'failed',
              error: errorMsg,
              requestPayload: { payload: webhookData.payload },
              responsePayload: null,
              durationMs,
              executedAt: startedAt,
            });
          } else if (status === 'retrying') {
            // Fails but has retryCount < maxRetries
            durationMs = Math.floor(Math.random() * 800) + 10;
            errorMsg = FAILURE_REASONS[(execCounter) % FAILURE_REASONS.length];
            retryCount = Math.floor(Math.random() * 3) + 1; // Retrying on attempt 1, 2, or 3
            
            steps.push({
              actionIndex: 0,
              actionType: rule.actions[0].actionType,
              status: 'failed',
              error: errorMsg,
              requestPayload: { payload: webhookData.payload },
              responsePayload: null,
              durationMs,
              executedAt: startedAt,
            });
          } else if (status === 'processing') {
            durationMs = Math.floor(Math.random() * 200);
            retryCount = 0;
            // First step succeeded, second step (if exists) is pending or we are on step 1
            steps.push({
              actionIndex: 0,
              actionType: rule.actions[0].actionType,
              status: 'success',
              requestPayload: { trigger: 'processing' },
              responsePayload: { job_registered: true },
              durationMs,
              executedAt: startedAt,
            });
          } else if (status === 'queued') {
            durationMs = 0;
            retryCount = 0;
            // No steps yet
          }

          const executionData = {
            _id: execId,
            tenantId: tenant._id,
            ruleId: rule._id,
            webhookEventId: webhookData._id,
            status,
            retryCount,
            startedAt,
            completedAt,
            durationMs,
            steps,
            error: errorMsg,
            createdAt: startedAt,
            updatedAt: completedAt || startedAt,
          };

          executionsToInsert.push(executionData);
          webhookExecutions.push(executionData);
        }

        // Align the WebhookEvent status with its executions
        // If all executions completed, webhook is completed.
        // If any failed, webhook is failed.
        // If any processing, webhook is processing.
        // If all queued, webhook is pending.
        const allCompleted = webhookExecutions.every(e => e.status === 'completed');
        const anyFailed = webhookExecutions.some(e => e.status === 'failed' || e.status === 'retrying');
        const anyProcessing = webhookExecutions.some(e => e.status === 'processing');

        if (anyFailed) {
          webhookData.status = 'failed';
          webhookData.error = webhookExecutions.find(e => e.error)?.error || 'Pipeline execution failed';
          webhookData.retryCount = Math.max(...webhookExecutions.map(e => e.retryCount));
        } else if (anyProcessing) {
          webhookData.status = 'processing';
        } else if (allCompleted) {
          webhookData.status = 'completed';
        } else {
          webhookData.status = 'pending';
        }
      }
    }

    // Bulk insert Webhook Events
    console.log('Inserting Webhook Events in database...');
    const insertedEvents = await eventModel.insertMany(webhooksToInsert);
    console.log(`  ✅ Bulk seeded ${insertedEvents.length} Webhook Events.`);

    // Bulk insert Executions
    console.log('Inserting Executions in database...');
    const insertedExecutions = await executionModel.insertMany(executionsToInsert);
    console.log(`  ✅ Bulk seeded ${insertedExecutions.length} Executions.`);

    // ── 4. Seed Replay History (approx 40 per tenant, total 400) ──────────────
    console.log('\nSeeding Replay History records...');
    const replaysToInsert: any[] = [];
    const executionDocsByTenant: Record<string, any[]> = {};

    // Group executions by tenant for easy fetching
    for (const exec of insertedExecutions) {
      if (!executionDocsByTenant[exec.tenantId.toString()]) {
        executionDocsByTenant[exec.tenantId.toString()] = [];
      }
      executionDocsByTenant[exec.tenantId.toString()].push(exec);
    }

    for (let t = 0; t < 10; t++) {
      const tenant = tenants[t];
      const tenantExecs = executionDocsByTenant[tenant._id.toHexString()] || [];
      // Pick failed executions to replay
      const failedExecs = tenantExecs.filter(e => e.status === 'failed');

      // We generate exactly 40 replay records per tenant
      for (let rIdx = 0; rIdx < 40; rIdx++) {
        // Link to a random failed execution if available, otherwise any execution
        const sourceExec = failedExecs[rIdx % failedExecs.length] || tenantExecs[rIdx % tenantExecs.length];
        
        if (!sourceExec) continue;

        const replayStatus = rIdx % 3 === 0 ? 'success' : rIdx % 3 === 1 ? 'failed' : 'triggered';
        const replayDate = new Date(sourceExec.startedAt.getTime() + 60000 * (rIdx + 5)); // Replayed 5-45 mins later

        const replayData = {
          tenantId: tenant._id,
          webhookEventId: sourceExec.webhookEventId,
          triggeredBy: rIdx % 2 === 0 ? 'Admin Operator' : 'System Auto-Recovery',
          status: replayStatus,
          executionId: sourceExec._id,
          reason: rIdx % 2 === 0
            ? 'Manual retry from failures dashboard to recover missing Slack alerts.'
            : 'Automated retry worker triggered event replay due to transient connection reset.',
          error: replayStatus === 'failed' ? 'HTTP 500: Server disconnected prematurely.' : undefined,
          createdAt: replayDate,
          updatedAt: replayDate,
        };

        replaysToInsert.push(replayData);
      }
    }

    const insertedReplays = await replayModel.insertMany(replaysToInsert);
    console.log(`  ✅ Successfully seeded ${insertedReplays.length} Replay History records.`);

    // ── 5. Output Beautiful Summary ──────────────────────────────────────────
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║               DATABASE SEED SUMMARY                       ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Total Tenants:        ${tenants.length.toString().padEnd(34)} ║`);
    console.log(`║  Total Rules:          ${insertedRules.length.toString().padEnd(34)} ║`);
    console.log(`║  Total Webhooks:       ${insertedEvents.length.toString().padEnd(34)} ║`);
    console.log(`║  Total Executions:     ${insertedExecutions.length.toString().padEnd(34)} ║`);
    console.log(`║  Total Replays:        ${insertedReplays.length.toString().padEnd(34)} ║`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Tenant ID List (Acme Corp to Kappa Retail):              ║');
    for (let i = 0; i < 10; i++) {
      console.log(`║   - ${TENANT_NAMES[i].padEnd(18)} : ${DEMO_TENANT_IDS[i].toHexString()} ║`);
    }
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Critical Error during database seeding:', error);
  } finally {
    console.log('Releasing NestJS Application context...');
    await app.close();
    console.log('Context released. Execution finished.');
  }
}

bootstrap().catch(err => {
  console.error('Fatal bootstrapper exception:', err);
  process.exit(1);
});
