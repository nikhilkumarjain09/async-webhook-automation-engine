import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
} from '@nestjs/bullmq';
import { AppLogger } from '../../common/logger/logger.service';

@QueueEventsListener('automation-queue')
export class AutomationQueueEventsListener extends QueueEventsHost {
  constructor(private readonly logger: AppLogger) {
    super();
    this.logger.setContext('AutomationQueueEvents');
  }

  @OnQueueEvent('active')
  onActive({ jobId, prev }: { jobId: string; prev?: string }) {
    this.logger.log(`Automation job ${jobId} started processing (prev status: ${prev || 'none'})`);
  }

  @OnQueueEvent('completed')
  onCompleted({ jobId, returnvalue }: { jobId: string; returnvalue: string }) {
    this.logger.log(`Automation job ${jobId} completed successfully. Return value: ${JSON.stringify(returnvalue)}`);
  }

  @OnQueueEvent('failed')
  onFailed({ jobId, failedReason }: { jobId: string; failedReason: string }) {
    this.logger.error(`Automation job ${jobId} failed. Reason: ${failedReason}`);
  }

  @OnQueueEvent('stalled')
  onStalled({ jobId }: { jobId: string }) {
    this.logger.warn(`Automation job ${jobId} has stalled!`);
  }
}
