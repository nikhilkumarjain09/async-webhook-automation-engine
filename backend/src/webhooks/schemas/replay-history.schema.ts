import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ReplayHistoryDocument = ReplayHistory & Document;

@Schema({ timestamps: true })
export class ReplayHistory {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  })
  tenantId: MongooseSchema.Types.ObjectId;

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
    trim: true,
  })
  triggeredBy: string;

  @Prop({
    type: String,
    required: true,
    enum: ['triggered', 'success', 'failed'],
    default: 'triggered',
    index: true,
  })
  status: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Execution',
    index: true,
  })
  executionId?: MongooseSchema.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 500,
  })
  reason: string;

  @Prop({ type: String, trim: true })
  error?: string;
}

export const ReplayHistorySchema = SchemaFactory.createForClass(ReplayHistory);

// Compound Index for auditing replays per event
ReplayHistorySchema.index({ tenantId: 1, webhookEventId: 1 });
ReplayHistorySchema.index({ createdAt: -1 });
