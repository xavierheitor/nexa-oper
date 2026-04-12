import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Matrícula do usuário',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  matricula!: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'password123',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  senha!: string;

  @ApiPropertyOptional({
    description: 'Versão do aplicativo móvel',
    example: '1.8.0',
  })
  @IsOptional()
  @IsString()
  versaoApp?: string;

  @ApiPropertyOptional({
    description: 'Plataforma do aplicativo móvel',
    example: 'android',
    enum: ['android', 'ios'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['android', 'ios'])
  plataformaApp?: string;
}
