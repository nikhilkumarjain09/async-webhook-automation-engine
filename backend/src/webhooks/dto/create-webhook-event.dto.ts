import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class CreateWebhookEventDto {
  @IsString()
  @IsNotEmpty()
  eventIdentifier: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  eventType: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxRetries?: number;
}
