import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { ExecutionQueryDto } from './dto/execution-query.dto';
import { Execution } from './schemas/execution.schema';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../tenant/decorators/current-tenant-id.decorator';

@Controller('executions')
@UseGuards(TenantGuard)
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Get()
  async findAll(
    @CurrentTenantId() tenantId: string,
    @Query() query: ExecutionQueryDto,
  ): Promise<Execution[]> {
    return this.executionsService.queryExecutions(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<Execution> {
    return this.executionsService.findById(tenantId, id);
  }
}
