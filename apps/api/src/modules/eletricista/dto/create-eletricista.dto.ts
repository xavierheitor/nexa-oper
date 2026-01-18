/**
 * DTO para criação de eletricistas
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ELETRICISTA_VALIDATION_CONFIG } from '@common/constants/eletricista';

export class CreateEletricistaDto {
  @ApiProperty({ description: 'Nome do eletricista', example: 'Joao Silva' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(ELETRICISTA_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter ao menos ${ELETRICISTA_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  })
  @MaxLength(ELETRICISTA_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${ELETRICISTA_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  nome: string;

  @ApiProperty({ description: 'Matricula do eletricista', example: 'MAT-123' })
  @IsString({ message: 'Matricula deve ser uma string' })
  @IsNotEmpty({ message: 'Matricula é obrigatória' })
  @MinLength(ELETRICISTA_VALIDATION_CONFIG.MIN_MATRICULA_LENGTH, {
    message: `Matricula deve ter ao menos ${ELETRICISTA_VALIDATION_CONFIG.MIN_MATRICULA_LENGTH} caractere`,
  })
  @MaxLength(ELETRICISTA_VALIDATION_CONFIG.MAX_MATRICULA_LENGTH, {
    message: `Matricula deve ter no máximo ${ELETRICISTA_VALIDATION_CONFIG.MAX_MATRICULA_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  matricula: string;

  @ApiProperty({
    description: 'Telefone do eletricista',
    example: '+55 31 99999-9999',
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @MinLength(ELETRICISTA_VALIDATION_CONFIG.MIN_TELEFONE_LENGTH, {
    message: `Telefone deve ter ao menos ${ELETRICISTA_VALIDATION_CONFIG.MIN_TELEFONE_LENGTH} caractere`,
  })
  @MaxLength(ELETRICISTA_VALIDATION_CONFIG.MAX_TELEFONE_LENGTH, {
    message: `Telefone deve ter no máximo ${ELETRICISTA_VALIDATION_CONFIG.MAX_TELEFONE_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  telefone: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'MG' })
  @IsString({ message: 'Estado deve ser uma string' })
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @Length(
    ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH,
    ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH,
    {
      message: `Estado deve ter ${ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH} caracteres`,
    }
  )
  @Transform(({ value }) => value?.trim().toUpperCase())
  estado: string;

  @ApiPropertyOptional({
    description: 'Data de admissão',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate({ message: 'Data de admissão deve ser uma data válida' })
  @Type(() => Date)
  admissao?: Date;

  @ApiProperty({ description: 'Cargo associado', example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'Cargo deve ser um número inteiro' })
  @IsPositive({ message: 'Cargo deve ser positivo' })
  cargoId: number;

  @ApiProperty({ description: 'Contrato associado', example: 12 })
  @Type(() => Number)
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @IsPositive({ message: 'Contrato deve ser positivo' })
  contratoId: number;
}
