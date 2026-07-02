import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant } from './schemas/tenant.schema';
import { TenantGuard } from './guards/tenant.guard';
import { Public } from './decorators/public.decorator';
import { CurrentTenantId } from './decorators/current-tenant-id.decorator';

@Controller('tenants')
@UseGuards(TenantGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Public() // Bypasses the TenantGuard since a tenant is not registered yet
  async create(@Body() createTenantDto: CreateTenantDto): Promise<Tenant> {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  async findAll(@CurrentTenantId() tenantId: string): Promise<Tenant[]> {
    // Return only the current tenant configuration to prevent cross-tenant information leakage
    const tenant = await this.tenantService.findById(tenantId);
    return [tenant];
  }

  @Get(':id')
  async findOne(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<Tenant> {
    if (id !== tenantId) {
      throw new ForbiddenException('Access denied: cross-tenant access prohibited');
    }
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  async update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<Tenant> {
    if (id !== tenantId) {
      throw new ForbiddenException('Access denied: cross-tenant mutation prohibited');
    }
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  async remove(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    if (id !== tenantId) {
      throw new ForbiddenException('Access denied: cross-tenant mutation prohibited');
    }
    return this.tenantService.remove(id);
  }
}
