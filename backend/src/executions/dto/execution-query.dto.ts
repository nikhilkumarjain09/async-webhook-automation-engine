import { IsString, IsOptional, IsEnum } from 'class-validator';

export class ExecutionQueryDto {
  @IsString()
  @IsOptional()
  ruleId?: string;

  @IsString()
  @IsOptional()
  webhookEventId?: string;

  @IsEnum(['running', 'success', 'failed', 'partial_success'])
  @IsOptional()
  status?: string;
}
