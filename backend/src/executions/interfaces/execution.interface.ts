export interface IExecutionStep {
  actionIndex: number;
  actionType: string;
  status: 'success' | 'failed';
  error?: string;
  requestPayload?: any;
  responsePayload?: any;
  durationMs: number;
  executedAt?: Date;
}

export interface IExecution {
  id?: string;
  tenantId: string;
  ruleId: string;
  webhookEventId: string;
  status: 'running' | 'success' | 'failed' | 'partial_success';
  startedAt: Date;
  completedAt?: Date;
  durationMs: number;
  steps: IExecutionStep[];
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
