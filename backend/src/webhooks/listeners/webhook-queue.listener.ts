import {
  QueueEventsHost,
  QueueEventsListener,
  OnQueueEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { WebhookEvent, WebhookEventDocument } from '../schemas/webhook-event.schema';
import { ExecutionsService } from '../../executions/executions.service';
import { AppLogger } from '../../common/logger/logger.service';

@QueueEventsListener('webhook-queue')
export class WebhookQueueEventsListener extends QueueEventsHost {
  constructor(
    @InjectQueue('webhook-queue')
    private readonly webhookQueue: Queue,
    @InjectModel(WebhookEvent.name)
    private readonly webhookEventModel: Model<WebhookEventDocument>,
    private readonly executionsService: ExecutionsService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext('WebhookQueueEvents');
  }

  @OnQueueEvent('active')
  onActive({ jobId, prev }: { jobId: string; prev?: string }) {
    this.logger.log(`Job ${jobId} started processing (prev status: ${prev || 'none'})`);
  }

  @OnQueueEvent('completed')
  onCompleted({ jobId, returnvalue }: { jobId: string; returnvalue: string }) {
    this.logger.log(`Job ${jobId} completed successfully. Return value: ${JSON.stringify(returnvalue)}`);
  }

  @OnQueueEvent('failed')
  async onFailed({ jobId, failedReason }: { jobId: string; failedReason: string }) {
    this.logger.error(`Job ${jobId} failed. Reason: ${failedReason}`);

    try {
      // Fetch job to retrieve original context payload
      const job = await this.webhookQueue.getJob(jobId);
      if (!job) {
        this.logger.warn(`Could not fetch job metadata for failed job ${jobId} (job might have been deleted)`);
        return;
      }

      const { eventId, tenantId } = job.data;
      if (!eventId || !tenantId) return;

      this.logger.log(`Executing worker crash / failure state recovery for eventId: ${eventId}`);

      // 1. Update WebhookEvent status in MongoDB to failed so it is not stuck in 'processing'
      await this.webhookEventModel.updateOne(
        { _id: eventId, status: 'processing' },
        {
          status: 'failed',
          error: `Queue processing failed permanently: ${failedReason}`,
        },
      ).exec();

      // 2. Mark any active 'processing' or 'queued' execution logs as failed
      await this.executionsService.failActiveExecutions(
        tenantId,
        eventId,
        `Queue worker execution crashed or job stalled: ${failedReason}`,
      );

      this.logger.log(`Crashed job recovery completed for job ${jobId}. Database states synced.`);
    } catch (err: any) {
      this.logger.error(`Failed executing state recovery for crashed job ${jobId}: ${err.message}`);
    }
  }

  @OnQueueEvent('stalled')
  onStalled({ jobId }: { jobId: string }) {
    this.logger.warn(`Job ${jobId} has stalled! Worker may have crashed or execution timed out.`);
  }

  @OnQueueEvent('progress')
  onProgress({ jobId, data }: { jobId: string; data: number | object }) {
    this.logger.log(`Job ${jobId} reported progress: ${JSON.stringify(data)}`);
  }
}
