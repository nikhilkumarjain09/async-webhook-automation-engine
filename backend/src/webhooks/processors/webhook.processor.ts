import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WebhookEvent, WebhookEventDocument } from '../schemas/webhook-event.schema';
import { TenantService } from '../../tenant/tenant.service';
import { RulesService } from '../../rules/rules.service';
import { RulesEngineService } from '../../rules/rules-engine.service';
import { ExecutionsService } from '../../executions/executions.service';
import { ActionsEngineService } from '../../actions/actions-engine.service';
import {
  RetryableActionException,
  NonRetryableActionException,
} from '../../actions/exceptions/action.exceptions';
import { AppLogger } from '../../common/logger/logger.service';

@Processor('webhook-queue', {
  concurrency: 10,
  lockDuration: 30000, // 30 seconds lock duration
  lockRenewTime: 15000, // renew lock every 15s
  stalledInterval: 30000, // check for stalled jobs every 30s
  maxStalledCount: 2, // retry stalled jobs up to 2 times
})
export class WebhookProcessor extends WorkerHost {
  constructor(
    @InjectModel(WebhookEvent.name)
    private readonly webhookEventModel: Model<WebhookEventDocument>,
    private readonly tenantService: TenantService,
    private readonly rulesService: RulesService,
    private readonly rulesEngineService: RulesEngineService,
    private readonly executionsService: ExecutionsService,
    private readonly actionsEngineService: ActionsEngineService,
    private readonly logger: AppLogger,
  ) {
    super();
    this.logger.setContext('WebhookProcessor');
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { eventId, eventIdentifier, tenantId } = job.data;
    this.logger.log(`Picked up webhook event job: ${eventIdentifier} (jobId: ${job.id}, attempts: ${job.attemptsMade})`);

    // 1. Atomic Lock check: update event state to 'processing' only if currently 'pending' or 'failed'
    // For job retries, we allow processing again if it was 'failed' (from a previous crashed run)
    const event = await this.webhookEventModel
      .findOneAndUpdate(
        {
          _id: eventId,
          status: { $in: ['pending', 'failed', 'processing'] }, // Allow processing retried jobs
        },
        {
          status: 'processing',
        },
        { new: true },
      )
      .exec();

    if (!event) {
      this.logger.warn(`Webhook event ${eventId} already completed. Skipping.`);
      return { skipped: true, reason: 'atomic_lock_bypassed' };
    }

    try {
      // 2. Load and validate Tenant status
      const tenant = await this.tenantService.findById(tenantId);
      if (tenant.status !== 'active') {
        throw new NonRetryableActionException(`Tenant '${tenant.name}' is suspended or deleted`);
      }

      // 3. Load active Automation Rules matching triggerSource and triggerEventType
      const allRules = await this.rulesService.findByTriggerEvent(
        tenantId,
        event.source,
        event.eventType,
      );

      // 4. Use Rules Engine to filter and return matching rules only
      const matchedRules = this.rulesEngineService.filterMatchingRules(
        event.payload,
        allRules,
      );

      this.logger.log(`RulesEngine resolved ${matchedRules.length} matching rules out of ${allRules.length} possible rules`);

      // 5. Loop matched rules and execute their actions using the Action Engine
      for (const rule of matchedRules) {
        const ruleIdStr = (rule as any)._id.toString();
        const eventIdStr = event._id.toString();

        this.logger.log(`Evaluating rule '${rule.name}'`);

        // Check if an execution already exists for this rule and event (to handle job retries!)
        let execution = await this.executionsService.findExistingExecution(
          tenantId,
          ruleIdStr,
          eventIdStr,
        );

        if (execution) {
          const status = execution.status;
          if (status === 'completed') {
            this.logger.log(`Rule '${rule.name}' was already executed successfully. Skipping.`);
            continue;
          }
          
          if (status === 'failed') {
            this.logger.log(`Rule '${rule.name}' previously failed permanently. Skipping.`);
            continue;
          }

          // If it was retrying, update status back to 'processing' to resume
          this.logger.log(`Resuming previously retried execution ${ (execution as any)._id } for rule '${rule.name}'`);
          execution = await this.executionsService.completeExecution(
            tenantId,
            (execution as any)._id.toString(),
            'processing',
          );
        } else {
          // Start a brand new execution log in database
          execution = await this.executionsService.startExecution(
            tenantId,
            ruleIdStr,
            eventIdStr,
            'processing',
          );
        }

        const startTime = Date.now();
        try {
          // Sort actions by execution order
          const sortedActions = [...rule.actions].sort((a, b) => a.order - b.order);

          for (const action of sortedActions) {
            // If this is a retry attempt, we might want to skip steps that succeeded in the previous run.
            // For simplicity and correctness, we check the execution steps log.
            // If the step index was already successfully logged, skip it!
            const stepAlreadySucceeded = execution.steps.some(
              (step) => step.actionIndex === action.order && step.status === 'success',
            );

            if (stepAlreadySucceeded) {
              this.logger.log(`Step ${action.order} (${action.actionType}) already succeeded in previous run. Skipping.`);
              continue;
            }

            const stepStart = Date.now();
            const compiledConfig = this.compileTemplates(action.config, event.payload);

            try {
              // Execute action using the Action Engine
              const output = await this.actionsEngineService.execute(
                action.actionType,
                compiledConfig,
                event.payload,
              );

              const stepDuration = Date.now() - stepStart;
              await this.executionsService.addStep(tenantId, (execution as any)._id.toString(), {
                actionIndex: action.order,
                actionType: action.actionType,
                status: 'success',
                requestPayload: compiledConfig,
                responsePayload: output,
                durationMs: stepDuration,
              });
            } catch (stepErr: any) {
              const stepDuration = Date.now() - stepStart;
              await this.executionsService.addStep(tenantId, (execution as any)._id.toString(), {
                actionIndex: action.order,
                actionType: action.actionType,
                status: 'failed',
                error: stepErr.message || 'Action failed',
                requestPayload: action.config,
                durationMs: stepDuration,
              });

              // Rethrow exception to interrupt actions loop
              throw stepErr;
            }
          }

          // Complete execution as completed
          const totalDuration = Date.now() - startTime;
          await this.executionsService.completeExecution(
            tenantId,
            (execution as any)._id.toString(),
            'completed',
            undefined,
            totalDuration,
          );
        } catch (err: any) {
          const totalDuration = Date.now() - startTime;

          // If the action threw a RetryableActionException, transition execution to 'retrying' and propagate to BullMQ
          if (err instanceof RetryableActionException) {
            this.logger.warn(`Action execution encountered transient error. Marking as retrying.`);
            await this.executionsService.completeExecution(
              tenantId,
              (execution as any)._id.toString(),
              'retrying',
              err.message,
              totalDuration,
            );
            throw err;
          }

          // Otherwise, it is a NonRetryableActionException or other permanent error.
          // Mark execution as failed and call job.discard() to halt remaining BullMQ retry attempts.
          this.logger.error(`Action execution encountered permanent error. Discarding remaining retries: ${err.message}`);
          await this.executionsService.completeExecution(
            tenantId,
            (execution as any)._id.toString(),
            'failed',
            err.message || 'Execution failed',
            totalDuration,
          );

          // Discard remaining retry attempts in BullMQ
          await job.discard();
          throw err;
        }
      }

      // 6. Update WebhookEvent Status to completed
      event.status = 'completed';
      event.error = undefined;
      await event.save();

      return { success: true, processedRules: matchedRules.length };
    } catch (error: any) {
      // Revert status to failed so it can be retried or inspected
      // Wait, if it is a retryable error, status goes to 'failed' temporarily but BullMQ will retry it, shifting status back to 'processing'
      event.status = 'failed';
      event.error = error.message;
      await event.save();

      this.logger.error(`Failed processing webhook job ${job.id}: ${error.message}`);
      
      // Propagate errors to BullMQ
      throw error;
    }
  }

  private getValueByPath(obj: any, path: string): any {
    if (!obj) return undefined;
    return path.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[part];
    }, obj);
  }

  private compileTemplates(config: any, payload: any): any {
    if (typeof config === 'string') {
      return config.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
        const trimmedPath = path.trim();
        const fieldPath = trimmedPath.startsWith('payload.')
          ? trimmedPath.substring(8)
          : trimmedPath;
        const val = this.getValueByPath(payload, fieldPath);
        return val !== undefined && val !== null ? String(val) : '';
      });
    }

    if (Array.isArray(config)) {
      return config.map((item) => this.compileTemplates(item, payload));
    }

    if (config !== null && typeof config === 'object') {
      const compiled: Record<string, any> = {};
      for (const [key, value] of Object.entries(config)) {
        compiled[key] = this.compileTemplates(value, payload);
      }
      return compiled;
    }

    return config;
  }
}
