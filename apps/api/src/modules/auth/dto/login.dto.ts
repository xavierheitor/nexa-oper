import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

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
}
