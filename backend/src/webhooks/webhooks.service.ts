import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash } from 'crypto';
import * as crypto from 'crypto';
import { WebhookEvent, WebhookEventDocument } from './schemas/webhook-event.schema';
import { ReplayHistory, ReplayHistoryDocument } from './schemas/replay-history.schema';
import { CreateReplayDto } from './dto/create-replay.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';
import { ReplayQueryDto } from './dto/replay-query.dto';
import { ExecutionsService } from '../executions/executions.service';
import { TenantService } from '../tenant/tenant.service';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(WebhookEvent.name)
    private readonly webhookEventModel: Model<WebhookEventDocument>,
    @InjectModel(ReplayHistory.name)
    private readonly replayHistoryModel: Model<ReplayHistoryDocument>,
    @InjectQueue('webhook-queue')
    private readonly webhookQueue: Queue,
    private readonly executionsService: ExecutionsService,
    private readonly tenantService: TenantService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('WebhooksService');
  }

  async ingestRawWebhook(
    tenantId: string,
    source: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
  ): Promise<WebhookEvent> {
    this.logger.log(`Ingesting raw webhook from source '${source}' for tenant: ${tenantId}`);

    // Reject malformed payloads (must be non-empty object)
    if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
      throw new BadRequestException('Payload must be a non-empty JSON object');
    }

    // Resolve Tenant webhook secrets and perform signature validation
    const tenant = await this.tenantService.findById(tenantId);
    const secret = tenant.settings?.webhookSecrets?.get
      ? tenant.settings.webhookSecrets.get(source)
      : (tenant.settings?.webhookSecrets as any)?.[source];

    if (!this.verifySignature(source, payload, headers, secret)) {
      throw new UnauthorizedException(`Webhook signature verification failed for source '${source}'`);
    }

    // Heuristically extract the event type from payload or headers
    const eventType =
      payload.type ||
      payload.event ||
      payload.eventType ||
      headers['x-github-event'] ||
      headers['x-event-type'] ||
      'webhook.received';

    // Resolve a deterministic event identifier
    const eventIdentifier = this.getDeterministicEventId(source, eventType, payload, headers);

    try {
      // Store raw webhook event in MongoDB
      const event = new this.webhookEventModel({
        tenantId,
        eventIdentifier,
        source,
        eventType,
        payload,
        headers,
        status: 'pending',
      });
      const savedEvent = await event.save();

      // Enqueue a BullMQ job (running in background, avoiding blocking the request)
      await this.webhookQueue.add(
        `${source}:${eventType}`,
        {
          eventId: savedEvent._id.toString(),
          eventIdentifier,
          tenantId,
          source,
          eventType,
          payload,
        },
        {
          attempts: savedEvent.maxRetries,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      return savedEvent;
    } catch (error: any) {
      // Handle MongoDB Duplicate Key (Code 11000) for webhook deduplication
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate webhook event detected (tenantId: ${tenantId}, eventIdentifier: ${eventIdentifier}). Skipping BullMQ enqueue.`,
        );
        const existingEvent = await this.webhookEventModel
          .findOne({ tenantId, eventIdentifier })
          .exec();
        
        if (existingEvent) {
          return existingEvent;
        }
      }
      throw error;
    }
  }

  async replayFailedExecution(
    tenantId: string,
    executionId: string,
    reason: string,
    triggeredBy: string,
  ): Promise<ReplayHistory> {
    this.logger.log(`Triggering manual replay for failed execution ${executionId} by ${triggeredBy}`);

    // 1. Fetch Execution log
    const execution = await this.executionsService.findById(tenantId, executionId);

    // 2. Validate status is failed
    if (execution.status !== 'failed') {
      throw new BadRequestException(
        `Only failed executions can be replayed. Current status: '${execution.status}'`,
      );
    }

    // 3. Load original WebhookEvent payload
    const event = await this.webhookEventModel
      .findOne({ _id: execution.webhookEventId, tenantId })
      .exec();
    if (!event) {
      throw new NotFoundException(`Webhook event with ID ${execution.webhookEventId} not found`);
    }

    // 4. Create ReplayHistory log
    const replay = new this.replayHistoryModel({
      tenantId,
      webhookEventId: event._id,
      triggeredBy,
      reason,
      status: 'triggered',
    });
    const savedReplay = await replay.save();

    // 5. Reset execution status to 'queued' to let the worker reprocess it
    await this.executionsService.completeExecution(
      tenantId,
      executionId,
      'queued',
      undefined,
      0, // Reset duration
    );

    // 6. Create a new queue job on webhook-queue (reusing original payload and headers)
    await this.webhookQueue.add(
      `${event.source}:${event.eventType}`,
      {
        eventId: event._id.toString(),
        eventIdentifier: event.eventIdentifier,
        tenantId,
        source: event.source,
        eventType: event.eventType,
        payload: event.payload,
        isReplay: true,
        replayId: savedReplay._id.toString(),
      },
      {
        attempts: event.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return savedReplay;
  }

  async triggerReplay(
    tenantId: string,
    dto: CreateReplayDto,
    triggeredBy: string,
  ): Promise<ReplayHistory> {
    this.logger.log(`Triggering replay for webhook: ${dto.webhookEventId} by ${triggeredBy}`);

    const event = await this.webhookEventModel.findOne({ _id: dto.webhookEventId, tenantId }).exec();
    if (!event) {
      throw new NotFoundException(`Webhook event with ID ${dto.webhookEventId} not found`);
    }

    const replay = new this.replayHistoryModel({
      tenantId,
      webhookEventId: event._id,
      triggeredBy,
      reason: dto.reason,
      status: 'triggered',
    });
    const savedReplay = await replay.save();

    // Re-enqueue the job for reprocessing
    await this.webhookQueue.add(
      `${event.source}:${event.eventType}`,
      {
        eventId: event._id.toString(),
        eventIdentifier: event.eventIdentifier,
        tenantId,
        source: event.source,
        eventType: event.eventType,
        payload: event.payload,
        isReplay: true,
        replayId: savedReplay._id.toString(),
      },
      {
        attempts: event.maxRetries,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return savedReplay;
  }

  async getWebhookLogs(tenantId: string, query: WebhookQueryDto): Promise<WebhookEvent[]> {
    this.logger.log(`Fetching webhook events for tenant: ${tenantId}`);
    const filters: any = { tenantId };

    if (query.status) filters.status = query.status;
    if (query.source) filters.source = query.source;
    if (query.eventType) filters.eventType = query.eventType;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return this.webhookEventModel
      .find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async getReplayLogs(tenantId: string, query: ReplayQueryDto): Promise<ReplayHistory[]> {
    this.logger.log(`Fetching replay logs for tenant: ${tenantId}`);
    const filters: any = { tenantId };

    if (query.status) filters.status = query.status;
    if (query.webhookEventId) filters.webhookEventId = query.webhookEventId;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return this.replayHistoryModel
      .find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async getWebhookLogById(tenantId: string, id: string): Promise<WebhookEvent> {
    this.logger.log(`Fetching webhook event ${id} for tenant: ${tenantId}`);
    const event = await this.webhookEventModel.findOne({ _id: id, tenantId }).exec();
    if (!event) {
      throw new NotFoundException(`Webhook event with ID ${id} not found for this tenant`);
    }
    return event;
  }

  private getDeterministicEventId(
    source: string,
    eventType: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
  ): string {
    // 1. Try resolving unique Github transaction delivery header ID
    if (headers && headers['x-github-delivery']) {
      return headers['x-github-delivery'];
    }

    // 2. Try resolving unique event ID keys in standard provider payloads (like Stripe 'id')
    const uniqueId =
      payload.id ||
      payload.eventId ||
      payload.event_id ||
      payload.uuid ||
      payload.eventIdentifier;

    if (uniqueId && typeof uniqueId === 'string' && uniqueId.trim().length > 0) {
      return uniqueId.trim();
    }

    // 3. Fallback: Generate a deterministic SHA-256 hash of payload payload + source + eventType
    const hash = createHash('sha256');
    hash.update(JSON.stringify(payload) + source + eventType);
    return `hash_${hash.digest('hex')}`;
  }

  private verifySignature(
    source: string,
    payload: Record<string, any>,
    headers: Record<string, string>,
    secret?: string,
  ): boolean {
    if (!secret) {
      // Backwards compatibility for dev/seeding/tests: skip verification if secret is not set
      this.logger.warn(`Signature verification skipped for source ${source}: No secret key configured in Tenant settings.`);
      return true;
    }

    const rawBodyString = JSON.stringify(payload);

    try {
      if (source === 'stripe') {
        const stripeSig = headers['stripe-signature'];
        if (!stripeSig) return false;

        const parts = stripeSig.split(',');
        const timestampPart = parts.find(p => p.trim().startsWith('t='));
        const signaturePart = parts.find(p => p.trim().startsWith('v1='));
        if (!timestampPart || !signaturePart) return false;

        const timestamp = timestampPart.trim().substring(2);
        const signature = signaturePart.trim().substring(3);

        const signingPayload = `${timestamp}.${rawBodyString}`;
        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(signingPayload)
          .digest('hex');

        return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
      }

      if (source === 'shopify') {
        const shopifySig = headers['x-shopify-hmac-sha256'];
        if (!shopifySig) return false;

        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBodyString)
          .digest('base64');

        return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(shopifySig));
      }

      if (source === 'github') {
        const githubSig = headers['x-hub-signature-256'];
        if (!githubSig) return false;

        const signature = githubSig.replace('sha256=', '');
        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBodyString)
          .digest('hex');

        return crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(signature));
      }

      if (source === 'hubspot') {
        const hubspotSig = headers['x-hubspot-signature'];
        if (!hubspotSig) return false;

        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBodyString)
          .digest('hex');

        return hubspotSig === computedSignature;
      }

      if (source === 'salesforce') {
        const sfSig = headers['x-salesforce-signature'];
        if (!sfSig) return false;

        const computedSignature = crypto
          .createHmac('sha256', secret)
          .update(rawBodyString)
          .digest('hex');

        return sfSig === computedSignature;
      }

      const authHeader = headers['authorization'] || headers['x-api-signature'];
      if (authHeader) {
        return authHeader.includes(secret);
      }
    } catch (err) {
      this.logger.error(`Error during signature verification for source ${source}:`, err);
      return false;
    }

    return true;
  }
}
