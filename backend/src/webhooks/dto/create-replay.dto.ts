import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateReplayDto {
  @IsString()
  @IsNotEmpty()
  webhookEventId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  reason: string;
}
