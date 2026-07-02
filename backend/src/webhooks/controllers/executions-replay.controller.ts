import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { WebhooksService } from '../webhooks.service';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../../tenant/decorators/current-tenant-id.decorator';
import { ReplayHistory } from '../schemas/replay-history.schema';
import { CreateReplayDto } from '../dto/create-replay.dto';

@Controller('executions')
@UseGuards(TenantGuard)
export class ExecutionsReplayController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':id/replay')
  async replay(
    @CurrentTenantId() tenantId: string,
    @Param('id') executionId: string,
    @Body() dto: Omit<CreateReplayDto, 'webhookEventId'>,
  ): Promise<{ success: boolean; data: ReplayHistory }> {
    // Stub user name triggers manual replay trace
    const data = await this.webhooksService.replayFailedExecution(
      tenantId,
      executionId,
      dto.reason,
      'admin-user',
    );
    return {
      success: true,
      data,
    };
  }
}
