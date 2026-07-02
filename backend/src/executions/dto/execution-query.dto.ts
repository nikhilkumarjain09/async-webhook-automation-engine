import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExecutionQueryDto {
  @IsString()
  @IsOptional()
  ruleId?: string;

  @IsString()
  @IsOptional()
  webhookEventId?: string;

  @IsEnum(['queued', 'processing', 'completed', 'failed', 'retrying'])
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
