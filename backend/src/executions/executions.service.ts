import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Execution, ExecutionDocument } from './schemas/execution.schema';
import { ExecutionQueryDto } from './dto/execution-query.dto';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectModel(Execution.name)
    private readonly executionModel: Model<ExecutionDocument>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('ExecutionsService');
  }

  async startExecution(
    tenantId: string,
    ruleId: string,
    webhookEventId: string,
    status: 'queued' | 'processing' = 'queued',
  ): Promise<Execution> {
    this.logger.log(`Starting execution for rule ${ruleId} and webhook event ${webhookEventId} (status: ${status})`);
    
    const execution = new this.executionModel({
      tenantId,
      ruleId,
      webhookEventId,
      status,
      startedAt: new Date(),
      steps: [],
    });
    return execution.save();
  }

  async findExistingExecution(
    tenantId: string,
    ruleId: string,
    webhookEventId: string,
  ): Promise<Execution | null> {
    return this.executionModel.findOne({ tenantId, ruleId, webhookEventId }).exec();
  }

  async addStep(
    tenantId: string,
    executionId: string,
    step: {
      actionIndex: number;
      actionType: string;
      status: 'success' | 'failed';
      error?: string;
      requestPayload?: any;
      responsePayload?: any;
      durationMs: number;
    },
  ): Promise<Execution> {
    this.logger.log(`Adding step result to execution ${executionId} under tenant ${tenantId}`);
    const updated = await this.executionModel
      .findOneAndUpdate(
        { _id: executionId, tenantId },
        {
          $push: {
            steps: {
              ...step,
              executedAt: new Date(),
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }
    return updated;
  }

  async completeExecution(
    tenantId: string,
    executionId: string,
    status: 'completed' | 'failed' | 'retrying' | 'processing' | 'queued',
    error?: string,
    durationMs?: number,
  ): Promise<Execution> {
    this.logger.log(`Updating execution ${executionId} status to '${status}' under tenant ${tenantId}`);

    const updateFields: any = {
      status,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
    };

    if (error !== undefined) updateFields.error = error;
    if (durationMs !== undefined) updateFields.durationMs = durationMs;

    // Increment retryCount atomically when transitioning to retrying state
    const updateQuery = status === 'retrying'
      ? { $set: updateFields, $inc: { retryCount: 1 } }
      : { $set: updateFields };

    const updated = await this.executionModel
      .findOneAndUpdate({ _id: executionId, tenantId }, updateQuery, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Execution with ID ${executionId} not found`);
    }
    return updated;
  }

  async queryExecutions(tenantId: string, query: ExecutionQueryDto): Promise<Execution[]> {
    this.logger.log(`Querying executions for tenant: ${tenantId}`);
    const filters: any = { tenantId };

    if (query.ruleId) filters.ruleId = query.ruleId;
    if (query.webhookEventId) filters.webhookEventId = query.webhookEventId;
    if (query.status) filters.status = query.status;

    return this.executionModel
      .find(filters)
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  async findById(tenantId: string, id: string): Promise<Execution> {
    this.logger.log(`Finding execution ${id} for tenant: ${tenantId}`);
    const execution = await this.executionModel.findOne({ _id: id, tenantId }).exec();
    if (!execution) {
      throw new NotFoundException(`Execution with ID ${id} not found`);
    }
    return execution;
  }

  async failActiveExecutions(
    tenantId: string,
    webhookEventId: string,
    error: string,
  ): Promise<void> {
    this.logger.log(`Marking all active executions as failed for webhookEventId: ${webhookEventId}`);
    await this.executionModel
      .updateMany(
        { tenantId, webhookEventId, status: { $in: ['queued', 'processing'] } },
        {
          status: 'failed',
          error,
          completedAt: new Date(),
        },
      )
      .exec();
  }
}
