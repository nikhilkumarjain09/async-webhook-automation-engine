import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../tenant/decorators/current-tenant-id.decorator';

@Controller('dashboard')
@UseGuards(TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentTenantId() tenantId: string): Promise<any> {
    return this.dashboardService.getStats(tenantId);
  }
}
