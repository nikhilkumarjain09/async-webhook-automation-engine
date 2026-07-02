import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { ActionsEngineService } from './actions-engine.service';
import { ActionDefinition, ActionDefinitionSchema } from './schemas/action-definition.schema';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActionDefinition.name, schema: ActionDefinitionSchema },
    ]),
    TenantModule,
  ],
  controllers: [ActionsController],
  providers: [ActionsService, ActionsEngineService],
  exports: [ActionsService, ActionsEngineService],
})
export class ActionsModule {}
