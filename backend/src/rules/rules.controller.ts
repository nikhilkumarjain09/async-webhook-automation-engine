import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { AutomationRule } from './schemas/automation-rule.schema';
import { TenantGuard } from '../tenant/guards/tenant.guard';
import { CurrentTenantId } from '../tenant/decorators/current-tenant-id.decorator';

@Controller('rules')
@UseGuards(TenantGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  async create(
    @CurrentTenantId() tenantId: string,
    @Body() createRuleDto: CreateRuleDto,
  ): Promise<AutomationRule> {
    return this.rulesService.create(tenantId, createRuleDto);
  }

  @Get()
  async findAll(
    @CurrentTenantId() tenantId: string,
    @Query() query: RuleQueryDto,
  ): Promise<AutomationRule[]> {
    return this.rulesService.findAll(tenantId, query);
  }

  @Get(':id')
  async findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<AutomationRule> {
    return this.rulesService.findById(tenantId, id);
  }

  @Patch(':id')
  async update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ): Promise<AutomationRule> {
    return this.rulesService.update(tenantId, id, updateRuleDto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    return this.rulesService.remove(tenantId, id);
  }
}
