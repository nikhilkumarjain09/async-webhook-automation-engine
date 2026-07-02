import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AppLogger } from '../../common/logger/logger.service';

@Processor('automation-queue', { concurrency: 5 })
export class AutomationProcessor extends WorkerHost {
  constructor(private readonly logger: AppLogger) {
    super();
    this.logger.setContext('AutomationProcessor');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing automation rule execution job: ${job.id}`);
    
    // Scaffolding: No business logic implemented yet.
    
    return { executed: true, jobId: job.id };
  }
}
