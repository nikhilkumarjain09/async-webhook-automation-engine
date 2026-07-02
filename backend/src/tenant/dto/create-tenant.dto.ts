import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TenantSettingsDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  maxDailyExecutions?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxRules?: number;

  @IsEmail()
  @IsOptional()
  alertEmail?: string;
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsEnum(['active', 'suspended', 'deleted'])
  @IsOptional()
  status?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantSettingsDto)
  settings?: TenantSettingsDto;
}
