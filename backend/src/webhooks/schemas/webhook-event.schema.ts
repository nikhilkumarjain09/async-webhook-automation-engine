import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type WebhookEventDocument = WebhookEvent & Document;

@Schema({ timestamps: true })
export class WebhookEvent {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true,
  })
  eventIdentifier: string; // Deterministic unique event ID from provider or payload hash

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true,
  })
  source: string;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true,
  })
  eventType: string;

  @Prop({
    type: MongooseSchema.Types.Mixed,
    required: true,
  })
  payload: Record<string, any>;

  @Prop({
    type: Map,
    of: String,
    default: {},
  })
  headers: Map<string, string>;

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({ type: Number, default: 0, min: 0 })
  retryCount: number;

  @Prop({ type: Number, default: 5, min: 0 })
  maxRetries: number;

  @Prop({ type: String, trim: true })
  error?: string;
}

export const WebhookEventSchema = SchemaFactory.createForClass(WebhookEvent);

// Compound Unique Index: prevents duplicate ingestion of same eventIdentifier for a given tenant
WebhookEventSchema.index({ tenantId: 1, eventIdentifier: 1 }, { unique: true });

// Compound Indexes for query optimization
WebhookEventSchema.index({ tenantId: 1, source: 1, eventType: 1 });
WebhookEventSchema.index({ tenantId: 1, status: 1 });
WebhookEventSchema.index({ createdAt: -1 });
