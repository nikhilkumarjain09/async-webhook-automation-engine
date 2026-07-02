import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationProcessor } from './processors/automation.processor';
import { AutomationQueueEventsListener } from './listeners/automation-queue.listener';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'automation-queue',
    }),
  ],
  providers: [AutomationProcessor, AutomationQueueEventsListener, WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
