export interface IReplayHistory {
  id?: string;
  tenantId: string;
  webhookEventId: string;
  triggeredBy: string; // User ID or api key identifier
  status: 'triggered' | 'success' | 'failed';
  executionId?: string; // Links to the newly generated Execution
  reason: string;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
