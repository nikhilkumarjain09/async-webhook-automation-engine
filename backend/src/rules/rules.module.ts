import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RulesService } from './rules.service';
import { RulesController } from './rules.controller';
import { RulesEngineService } from './rules-engine.service';
import { AutomationRule, AutomationRuleSchema } from './schemas/automation-rule.schema';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AutomationRule.name, schema: AutomationRuleSchema }]),
    TenantModule,
  ],
  controllers: [RulesController],
  providers: [RulesService, RulesEngineService],
  exports: [RulesService, RulesEngineService],
})
export class RulesModule {}
