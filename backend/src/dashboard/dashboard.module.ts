import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WebhookEvent, WebhookEventSchema } from '../webhooks/schemas/webhook-event.schema';
import { Execution, ExecutionSchema } from '../executions/schemas/execution.schema';
import { AutomationRule, AutomationRuleSchema } from '../rules/schemas/automation-rule.schema';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: Execution.name, schema: ExecutionSchema },
      { name: AutomationRule.name, schema: AutomationRuleSchema },
    ]),
    TenantModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
