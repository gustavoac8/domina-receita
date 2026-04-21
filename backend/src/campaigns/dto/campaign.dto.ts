import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export enum AdChannelDto {
  META = 'META',
  GOOGLE = 'GOOGLE',
  TIKTOK = 'TIKTOK',
  YOUTUBE = 'YOUTUBE',
}

export enum CampaignStatusDto {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  FINISHED = 'FINISHED',
}

export class CreateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clinicId?: string;

  @ApiProperty({ example: 'Botox — Floripa centro' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ enum: AdChannelDto })
  @IsEnum(AdChannelDto)
  channel!: AdChannelDto;

  @ApiProperty({ example: 'leads' })
  @IsString()
  objective!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  dailyBudget!: number;

  @ApiPropertyOptional({
    description: 'Se omitido, o backend gera copy/criativo via IA',
  })
  @IsOptional()
  @IsObject()
  copy?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  targeting?: Record<string, any>;
}

export class UpdateCampaignStatusDto {
  @ApiProperty({ enum: CampaignStatusDto })
  @IsEnum(CampaignStatusDto)
  status!: CampaignStatusDto;
}
