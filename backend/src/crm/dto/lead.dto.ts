import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum LeadStageDto {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  SCHEDULED = 'SCHEDULED',
  ATTENDED = 'ATTENDED',
  RECURRING = 'RECURRING',
  LOST = 'LOST',
}

export class CreateLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: '+55 48 99999-0000' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'meta' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ example: 'Botox' })
  @IsOptional()
  @IsString()
  procedure?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLeadStageDto {
  @ApiProperty({ enum: LeadStageDto })
  @IsEnum(LeadStageDto)
  stage!: LeadStageDto;
}

export class AddLeadActivityDto {
  @ApiProperty({ example: 'whatsapp' })
  @IsString()
  kind!: string;

  @ApiProperty({ example: { message: 'Olá, tudo bem?' } })
  payload!: Record<string, any>;
}
