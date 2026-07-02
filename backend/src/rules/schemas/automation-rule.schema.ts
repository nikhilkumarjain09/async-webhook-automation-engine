import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AutomationRuleDocument = AutomationRule & Document;

@Schema({ _id: false })
export class RuleCondition {
  @Prop({ type: String, required: true, trim: true })
  field: string;

  @Prop({
    type: String,
    required: true,
    enum: ['equals', 'notequals', 'contains', 'greaterThan', 'lessThan'],
  })
  operator: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value: any;
}

@Schema({ _id: false })
export class RuleAction {
  @Prop({
    type: String,
    required: true,
    enum: ['http_call', 'slack_notify', 'email_send', 'db_operation'],
  })
  actionType: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true, default: {} })
  config: Record<string, any>;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  order: number;
}

@Schema({ timestamps: true })
export class AutomationRule {
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
    trim: true,
    minlength: 2,
    maxlength: 100,
  })
  name: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true,
  })
  triggerSource: string;

  @Prop({
    type: String,
    required: true,
    index: true,
    trim: true,
  })
  triggerEventType: string;

  @Prop({
    type: [RuleCondition],
    default: [],
  })
  conditions: RuleCondition[];

  @Prop({
    type: [RuleAction],
    default: [],
  })
  actions: RuleAction[];

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  })
  status: string;
}

export const AutomationRuleSchema = SchemaFactory.createForClass(AutomationRule);

// Compound Index to search rules matching an incoming webhook event swiftly
AutomationRuleSchema.index({
  tenantId: 1,
  triggerSource: 1,
  triggerEventType: 1,
  status: 1,
});
AutomationRuleSchema.index({ createdAt: -1 });
