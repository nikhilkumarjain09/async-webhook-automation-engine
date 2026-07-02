import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ _id: false })
export class TenantSettingsSchema {
  @Prop({ type: Number, default: 10000, min: 0 })
  maxDailyExecutions: number;

  @Prop({ type: Number, default: 50, min: 0 })
  maxRules: number;

  @Prop({
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  })
  alertEmail?: string;

  @Prop({ type: Map, of: String, default: {} })
  webhookSecrets: Map<string, string>;
}

@Schema({ timestamps: true })
export class Tenant {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
    index: true,
  })
  name: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    index: true,
    select: false, // Secure by default
  })
  apiKey: string;

  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}$/, 'Please enter a valid domain'],
  })
  domain?: string;

  @Prop({
    type: String,
    required: true,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
    index: true,
  })
  status: string;

  @Prop({
    type: TenantSettingsSchema,
    default: () => ({}),
  })
  settings: TenantSettingsSchema;
}

export const TenantSchema = SchemaFactory.createForClass(Tenant);
