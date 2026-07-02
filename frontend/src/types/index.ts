export interface TenantSettings {
  maxDailyExecutions: number;
  maxRules: number;
  alertEmail?: string;
}

export interface Tenant {
  _id: string;
  name: string;
  apiKey: string;
  domain?: string;
  status: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEvent {
  _id: string;
  tenantId: string;
  eventIdentifier: string;
  source: string;
  eventType: string;
  payload: Record<string, any>;
  headers: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'greaterThan' | 'contains';
  value: string;
}

export interface RuleAction {
  order: number;
  actionType: 'http_call' | 'email_send' | 'slack_notify' | 'db_operation';
  config: Record<string, any>;
}

export interface AutomationRule {
  _id: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerSource: string;
  triggerEventType: string;
  status: 'active' | 'inactive';
  conditions: RuleCondition[];
  actions: RuleAction[];
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionStep {
  actionIndex: number;
  actionType: string;
  status: 'success' | 'failed';
  error?: string;
  requestPayload?: any;
  responsePayload?: any;
  durationMs: number;
  executedAt: string;
}

export interface Execution {
  _id: string;
  tenantId: string;
  ruleId: string | {
    _id: string;
    name: string;
    triggerSource: string;
    triggerEventType: string;
    description?: string;
  };
  webhookEventId: string | {
    _id: string;
    source: string;
    eventType: string;
    eventIdentifier: string;
  };
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'retrying';
  retryCount: number;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  steps: ExecutionStep[];
  error?: string;
  createdAt: string;
}

export interface ReplayHistory {
  _id: string;
  tenantId: string;
  webhookEventId: string | { _id: string; eventIdentifier: string };
  triggeredBy: string;
  reason: string;
  status: string;
  createdAt: string;
}
