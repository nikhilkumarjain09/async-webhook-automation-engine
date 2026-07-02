import { Request } from 'express';

export interface TenantSettings {
  maxDailyExecutions: number;
  maxRules: number;
  alertEmail?: string;
}

export interface ITenant {
  id?: string;
  name: string;
  apiKey: string;
  domain?: string;
  status: string;
  settings: TenantSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantRequest extends Request {
  tenant?: ITenant;
  tenantId?: string;
}
