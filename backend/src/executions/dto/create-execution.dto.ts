import { IsString, IsNotEmpty } from 'class-validator';

export class CreateExecutionDto {
  @IsString()
  @IsNotEmpty()
  ruleId: string;

  @IsString()
  @IsNotEmpty()
  webhookEventId: string;
}
