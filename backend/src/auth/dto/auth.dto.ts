import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'dr.silva@clinica.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Dr. João Silva' })
  @IsString()
  @MinLength(2)
  name!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'dr.silva@clinica.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  password!: string;
}
