export interface IWebhookEvent {
  id?: string;
  tenantId: string;
  eventIdentifier: string; // Unique transaction identifier
  source: string; // e.g. stripe, github
  eventType: string; // e.g. user.created
  payload: Record<string, any>;
  headers?: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
