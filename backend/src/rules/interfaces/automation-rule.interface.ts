export interface IAutomationRuleCondition {
  field: string;
  operator: 'equals' | 'notequals' | 'contains' | 'greaterThan' | 'lessThan';
  value: any;
}

export interface IAutomationRuleAction {
  actionType: 'http_call' | 'slack_notify' | 'email_send' | 'db_operation';
  config: Record<string, any>;
  order: number;
}

export interface IAutomationRule {
  id?: string;
  tenantId: string;
  name: string;
  description?: string;
  triggerSource: string; // e.g. stripe
  triggerEventType: string; // e.g. charge.succeeded
  conditions: IAutomationRuleCondition[];
  actions: IAutomationRuleAction[];
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}
