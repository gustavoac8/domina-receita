import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDiagnosticoDto {
  @ApiProperty({ example: 'Dermatologia' })
  @IsString()
  @MinLength(2)
  specialty!: string;

  @ApiProperty({ example: 'Florianópolis' })
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Id da clínica (opcional; se omitido usa a clínica default do usuário)',
  })
  @IsOptional()
  @IsString()
  clinicId?: string;
}
