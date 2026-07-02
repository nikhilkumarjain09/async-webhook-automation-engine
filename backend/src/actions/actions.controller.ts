import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { ActionDefinition } from './schemas/action-definition.schema';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../tenant/decorators/current-tenant-id.decorator';

@Controller('actions')
@UseGuards(TenantGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  async create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateActionDto,
  ): Promise<ActionDefinition> {
    return this.actionsService.create(tenantId, dto);
  }

  @Get()
  async findAll(@CurrentTenantId() tenantId: string): Promise<ActionDefinition[]> {
    return this.actionsService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ActionDefinition> {
    return this.actionsService.findById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateActionDto>,
  ): Promise<ActionDefinition> {
    return this.actionsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    return this.actionsService.remove(tenantId, id);
  }
}
