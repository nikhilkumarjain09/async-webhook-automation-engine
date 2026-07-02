import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class WorkerService implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext('WorkerService');
  }

  onApplicationBootstrap() {
    this.logger.log('Worker processes initialized and listening to queues');
  }

  onApplicationShutdown() {
    this.logger.log('Shutting down workers cleanly');
  }
}
