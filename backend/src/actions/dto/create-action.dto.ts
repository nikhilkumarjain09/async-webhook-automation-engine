import { IsString, IsNotEmpty, IsEnum, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class CreateActionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['http_call', 'slack_notify', 'email_send', 'db_operation'])
  type: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
