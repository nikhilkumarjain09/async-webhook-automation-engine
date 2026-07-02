import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { WebhooksController } from './webhooks.controller';
import { ExecutionsReplayController } from './controllers/executions-replay.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookProcessor } from './processors/webhook.processor';
import { WebhookQueueEventsListener } from './listeners/webhook-queue.listener';
import { WebhookEvent, WebhookEventSchema } from './schemas/webhook-event.schema';
import { ReplayHistory, ReplayHistorySchema } from './schemas/replay-history.schema';
import { TenantModule } from '../tenant/tenant.module';
import { RulesModule } from '../rules/rules.module';
import { ExecutionsModule } from '../executions/executions.module';
import { ActionsModule } from '../actions/actions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WebhookEvent.name, schema: WebhookEventSchema },
      { name: ReplayHistory.name, schema: ReplayHistorySchema },
    ]),
    BullModule.registerQueue({
      name: 'webhook-queue',
    }),
    TenantModule,
    RulesModule,
    ExecutionsModule,
    ActionsModule,
  ],
  controllers: [WebhooksController, ExecutionsReplayController],
  providers: [WebhooksService, WebhookProcessor, WebhookQueueEventsListener],
  exports: [WebhooksService],
})
export class WebhooksModule {}
