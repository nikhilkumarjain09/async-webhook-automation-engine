import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import envConfig from './config/env.config';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from './common/logger/logger.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TenantModule } from './tenant/tenant.module';
import { RulesModule } from './rules/rules.module';
import { ActionsModule } from './actions/actions.module';
import { ExecutionsModule } from './executions/executions.module';
import { WorkerModule } from './worker/worker.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TenantMiddleware } from './tenant/middlewares/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
    }),
    LoggerModule,
    DatabaseModule,
    QueueModule,
    TenantModule,
    WebhooksModule,
    RulesModule,
    ActionsModule,
    ExecutionsModule,
    WorkerModule,
    DashboardModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply multi-tenant middleware globally
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
