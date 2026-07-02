import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ActionDefinitionDocument = ActionDefinition & Document;

@Schema({ timestamps: true })
export class ActionDefinition {
  @Prop({ required: true, index: true })
  tenantId: string; // Enforce multi-tenancy for action definitions

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    enum: ['http_call', 'slack_notify', 'email_send', 'db_operation'],
  })
  type: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  config: Record<string, any>; // Store connection details, credentials, urls

  @Prop({ default: true })
  isActive: boolean;
}

export const ActionDefinitionSchema = SchemaFactory.createForClass(ActionDefinition);
