import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  HttpStatus,
  HttpCode,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateReplayDto } from './dto/create-replay.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';
import { ReplayQueryDto } from './dto/replay-query.dto';
import { WebhookEvent } from './schemas/webhook-event.schema';
import { ReplayHistory } from './schemas/replay-history.schema';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../tenant/decorators/current-tenant-id.decorator';

@Controller('webhooks')
@UseGuards(TenantGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':source')
  @HttpCode(HttpStatus.OK) // HTTP 200 immediately
  async ingest(
    @CurrentTenantId() tenantId: string,
    @Param('source') source: string,
    @Headers() headers: Record<string, string>,
    @Body() payload: Record<string, any>,
  ): Promise<{ success: boolean; eventId: string }> {
    const data = await this.webhooksService.ingestRawWebhook(tenantId, source, payload, headers);
    return {
      success: true,
      eventId: data.eventIdentifier,
    };
  }

  @Post('replay')
  async replay(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateReplayDto,
  ): Promise<{ success: boolean; data: ReplayHistory }> {
    const data = await this.webhooksService.triggerReplay(tenantId, dto, 'admin-user');
    return {
      success: true,
      data,
    };
  }

  @Get('replays')
  async getReplayLogs(
    @CurrentTenantId() tenantId: string,
    @Query() query: ReplayQueryDto,
  ): Promise<ReplayHistory[]> {
    return this.webhooksService.getReplayLogs(tenantId, query);
  }

  @Get()
  async getLogs(
    @CurrentTenantId() tenantId: string,
    @Query() query: WebhookQueryDto,
  ): Promise<WebhookEvent[]> {
    return this.webhooksService.getWebhookLogs(tenantId, query);
  }

  @Get(':id')
  async getLogById(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<WebhookEvent> {
    return this.webhooksService.getWebhookLogById(tenantId, id);
  }
}
