import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AutomationRule, AutomationRuleDocument } from './schemas/automation-rule.schema';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleQueryDto } from './dto/rule-query.dto';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class RulesService {
  constructor(
    @InjectModel(AutomationRule.name)
    private readonly ruleModel: Model<AutomationRuleDocument>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('RulesService');
  }

  async create(tenantId: string, createRuleDto: CreateRuleDto): Promise<AutomationRule> {
    this.logger.log(`Creating rule '${createRuleDto.name}' for tenant: ${tenantId}`);
    const created = new this.ruleModel({
      ...createRuleDto,
      tenantId,
    });
    return created.save();
  }

  async findAll(tenantId: string, query: RuleQueryDto): Promise<AutomationRule[]> {
    this.logger.log(`Fetching rules for tenant: ${tenantId}`);
    const filters: any = { tenantId };

    if (query.status) filters.status = query.status;
    if (query.triggerSource) filters.triggerSource = query.triggerSource;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    return this.ruleModel
      .find(filters)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findByTriggerEvent(
    tenantId: string,
    source: string,
    eventType: string,
  ): Promise<AutomationRule[]> {
    this.logger.log(`Fetching active rules for trigger ${source}:${eventType} and tenant: ${tenantId}`);
    return this.ruleModel
      .find({
        tenantId,
        triggerSource: source,
        triggerEventType: eventType,
        status: 'active',
      })
      .exec();
  }

  async findById(tenantId: string, id: string): Promise<AutomationRule> {
    this.logger.log(`Finding rule ${id} for tenant: ${tenantId}`);
    const rule = await this.ruleModel.findOne({ _id: id, tenantId }).exec();
    if (!rule) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(
    tenantId: string,
    id: string,
    updateRuleDto: UpdateRuleDto,
  ): Promise<AutomationRule> {
    this.logger.log(`Updating rule ${id} for tenant: ${tenantId}`);
    const updated = await this.ruleModel
      .findOneAndUpdate({ _id: id, tenantId }, updateRuleDto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return updated;
  }

  async remove(tenantId: string, id: string): Promise<{ deleted: boolean }> {
    this.logger.log(`Deleting rule ${id} for tenant: ${tenantId}`);
    const result = await this.ruleModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!result) {
      throw new NotFoundException(`Rule with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
