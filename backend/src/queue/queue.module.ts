import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db'),
        },
        defaultJobOptions: {
          attempts: 5, // Retry up to 5 times
          backoff: {
            type: 'exponential',
            delay: 5000, // Starts at 5s delay, then doubling (10s, 20s, 40s...)
          },
          removeOnComplete: {
            age: 3600, // Automatically delete completed jobs after 1 hour (keeps memory lean)
            count: 1000, // Maximum of 1000 completed records kept
          },
          removeOnFail: {
            age: 24 * 3600, // Automatically delete failed jobs after 24 hours
            count: 5000, // Keep last 5000 failures for audit
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class QueueModule {}
