import { Injectable, NotFoundException, ConflictException, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AppLogger } from '../common/logger/logger.service';

const DEFAULT_TENANTS = [
  {
    _id: new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f1'),
    name: 'Acme Corporation',
    apiKey: 'acme_apikey_xyz',
    domain: 'acme.com',
    status: 'active',
    settings: {
      maxDailyExecutions: 10000,
      maxRules: 50,
      alertEmail: 'alerts@acme.com',
    },
  },
  {
    _id: new Types.ObjectId('60d5ec4a2f8fb814c8f8d9f2'),
    name: 'Beta Industries',
    apiKey: 'beta_apikey_abc',
    domain: 'beta.com',
    status: 'active',
    settings: {
      maxDailyExecutions: 5000,
      maxRules: 20,
      alertEmail: 'devs@beta.com',
    },
  },
];

@Injectable()
export class TenantService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<TenantDocument>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('TenantService');
  }

  async onApplicationBootstrap() {
    try {
      // Upsert each default tenant by _id so this is always idempotent
      for (const tenant of DEFAULT_TENANTS) {
        const exists = await this.tenantModel.findById(tenant._id).exec();
        if (!exists) {
          await this.tenantModel.create(tenant);
          this.logger.log(`Seeded default tenant: ${tenant.name} (${tenant._id.toHexString()})`);
        } else {
          this.logger.log(`Default tenant already exists: ${tenant.name}`);
        }
      }
    } catch (err) {
      this.logger.error('Bootstrap tenant seed failed:', err?.message ?? err);
    }
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    this.logger.log(`Creating new tenant: ${createTenantDto.name}`);

    const existing = await this.tenantModel.findOne({ name: createTenantDto.name }).exec();
    if (existing) {
      throw new ConflictException(`Tenant with name '${createTenantDto.name}' already exists`);
    }

    const created = new this.tenantModel(createTenantDto);
    return created.save();
  }

  async findAll(): Promise<Tenant[]> {
    this.logger.log('Fetching all tenants');
    return this.tenantModel.find().exec();
  }

  async findById(id: string): Promise<Tenant> {
    this.logger.log(`Finding tenant by ID: ${id}`);
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findByIdWithApiKey(id: string): Promise<Tenant> {
    this.logger.log(`Finding tenant by ID with API key: ${id}`);
    const tenant = await this.tenantModel.findById(id).select('+apiKey').exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    this.logger.log(`Updating tenant with ID: ${id}`);
    const updated = await this.tenantModel
      .findByIdAndUpdate(id, updateTenantDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    this.logger.log(`Deleting tenant with ID: ${id}`);
    const result = await this.tenantModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
