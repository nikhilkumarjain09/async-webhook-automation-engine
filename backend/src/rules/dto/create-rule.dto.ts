import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RuleConditionDto {
  @IsString()
  @IsNotEmpty()
  field: string;

  @IsEnum(['equals', 'notequals', 'contains', 'greaterThan', 'lessThan'])
  operator: string;

  @IsNotEmpty()
  value: any;
}

export class RuleActionDto {
  @IsEnum(['http_call', 'slack_notify', 'email_send', 'db_operation'])
  actionType: string;

  @IsObject()
  @IsNotEmpty()
  config: Record<string, any>;

  @IsInt()
  @Min(0)
  order: number;
}

export class CreateRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  triggerSource: string;

  @IsString()
  @IsNotEmpty()
  triggerEventType: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions?: RuleConditionDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RuleActionDto)
  actions?: RuleActionDto[];

  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;
}
