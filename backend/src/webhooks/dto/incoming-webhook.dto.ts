import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class IncomingWebhookDto {
  @IsString()
  @IsNotEmpty()
  event: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
