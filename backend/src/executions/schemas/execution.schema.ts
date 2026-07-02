import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ExecutionDocument = Execution & Document;

@Schema({ _id: false })
export class ExecutionStep {
  @Prop({ type: Number, required: true, min: 0 })
  actionIndex: number;

  @Prop({ type: String, required: true, trim: true })
  actionType: string;

  @Prop({
    type: String,
    required: true,
    enum: ['success', 'failed'],
  })
  status: string;

  @Prop({ type: String, trim: true })
  error?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  requestPayload?: any;

  @Prop({ type: MongooseSchema.Types.Mixed })
  responsePayload?: any;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  durationMs: number;

  @Prop({ type: Date, required: true, default: Date.now })
  executedAt: Date;
}

@Schema({ timestamps: true })
export class Execution {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'AutomationRule',
    required: true,
    index: true,
  })
  ruleId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WebhookEvent',
    required: true,
    index: true,
  })
  webhookEventId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['queued', 'processing', 'completed', 'failed', 'retrying'],
    default: 'queued',
    index: true,
  })
  status: string;

  @Prop({ type: Number, default: 0, min: 0 })
  retryCount: number;

  @Prop({ type: Date, required: true, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  durationMs: number;

  @Prop({
    type: [ExecutionStep],
    default: [],
  })
  steps: ExecutionStep[];

  @Prop({ type: String, trim: true })
  error?: string;
}

export const ExecutionSchema = SchemaFactory.createForClass(Execution);

// Compound Index for auditing executions
ExecutionSchema.index({ tenantId: 1, ruleId: 1 });
ExecutionSchema.index({ tenantId: 1, webhookEventId: 1 });
ExecutionSchema.index({ tenantId: 1, status: 1 });
ExecutionSchema.index({ createdAt: -1 });
