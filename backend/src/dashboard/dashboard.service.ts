import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WebhookEvent, WebhookEventDocument } from '../webhooks/schemas/webhook-event.schema';
import { Execution, ExecutionDocument } from '../executions/schemas/execution.schema';
import { AutomationRule, AutomationRuleDocument } from '../rules/schemas/automation-rule.schema';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(WebhookEvent.name)
    private readonly webhookEventModel: Model<WebhookEventDocument>,
    @InjectModel(Execution.name)
    private readonly executionModel: Model<ExecutionDocument>,
    @InjectModel(AutomationRule.name)
    private readonly ruleModel: Model<AutomationRuleDocument>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('DashboardService');
  }

  async getStats(tenantId: string): Promise<any> {
    this.logger.log(`Aggregating dashboard statistics for tenant: ${tenantId}`);
    const tenantObjectId = new Types.ObjectId(tenantId);

    // 1. Webhook statistics by status
    const webhookStats = await this.webhookEventModel.aggregate([
      { $match: { tenantId: tenantObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 2. Execution statistics by status
    const executionStats = await this.executionModel.aggregate([
      { $match: { tenantId: tenantObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // 3. Automation rules by status
    const ruleStats = await this.ruleModel.aggregate([
      { $match: { tenantId: tenantObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Format results to key-value objects
    const webhooks = webhookStats.reduce<Record<string, number>>((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { pending: 0, processing: 0, completed: 0, failed: 0 });

    const executions = executionStats.reduce<Record<string, number>>((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { queued: 0, processing: 0, completed: 0, failed: 0, retrying: 0 });

    const rules = ruleStats.reduce<Record<string, number>>((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { active: 0, inactive: 0 });

    // Calculate metrics
    const totalWebhooks = Object.values(webhooks).reduce((a, b) => a + b, 0);
    const totalExecutions = Object.values(executions).reduce((a, b) => a + b, 0);
    const successRate = totalExecutions > 0
      ? Number(((executions.completed / totalExecutions) * 100).toFixed(2))
      : 100.00;

    return {
      metrics: {
        totalWebhooks,
        totalExecutions,
        successRate,
      },
      webhooks,
      executions,
      rules,
      timestamp: new Date().toISOString(),
    };
  }
}
