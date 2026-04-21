import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateClinicDto {
  @ApiProperty({ example: 'Clínica Pele Clara' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Dermatologia' })
  @IsString()
  specialty!: string;

  @ApiProperty({ example: 'Florianópolis' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'SC' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;
}
