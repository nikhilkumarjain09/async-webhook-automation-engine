import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ActionDefinition, ActionDefinitionDocument } from './schemas/action-definition.schema';
import { CreateActionDto } from './dto/create-action.dto';
import { AppLogger } from '../common/logger/logger.service';

@Injectable()
export class ActionsService {
  constructor(
    @InjectModel(ActionDefinition.name)
    private readonly actionModel: Model<ActionDefinitionDocument>,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext('ActionsService');
  }

  async create(tenantId: string, dto: CreateActionDto): Promise<ActionDefinition> {
    this.logger.log(`Creating action definition '${dto.name}' of type '${dto.type}' for tenant: ${tenantId}`);
    const created = new this.actionModel({
      ...dto,
      tenantId,
    });
    return created.save();
  }

  async findAll(tenantId: string): Promise<ActionDefinition[]> {
    this.logger.log(`Fetching all action definitions for tenant: ${tenantId}`);
    return this.actionModel.find({ tenantId }).exec();
  }

  async findById(tenantId: string, id: string): Promise<ActionDefinition> {
    this.logger.log(`Finding action definition ${id} for tenant: ${tenantId}`);
    const action = await this.actionModel.findOne({ _id: id, tenantId }).exec();
    if (!action) {
      throw new NotFoundException(`Action definition with ID ${id} not found`);
    }
    return action;
  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<CreateActionDto>,
  ): Promise<ActionDefinition> {
    this.logger.log(`Updating action definition ${id} for tenant: ${tenantId}`);
    const updated = await this.actionModel
      .findOneAndUpdate({ _id: id, tenantId }, dto, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Action definition with ID ${id} not found`);
    }
    return updated;
  }

  async remove(tenantId: string, id: string): Promise<{ deleted: boolean }> {
    this.logger.log(`Deleting action definition ${id} for tenant: ${tenantId}`);
    const result = await this.actionModel.findOneAndDelete({ _id: id, tenantId }).exec();
    if (!result) {
      throw new NotFoundException(`Action definition with ID ${id} not found`);
    }
    return { deleted: true };
  }
}
