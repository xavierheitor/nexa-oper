/**
 * DTO para parâmetros de consulta de eletricistas
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import {
  ELETRICISTA_VALIDATION_CONFIG,
  VALIDATION_CONFIG,
} from '../constants/eletricista.constants';

export class EletricistaQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser numérica' })
  @IsPositive({ message: 'Página deve ser positiva' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Limite por página',
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite deve ser numérico' })
  @IsPositive({ message: 'Limite deve ser positivo' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Termo de busca (nome, matrícula ou telefone)',
    example: 'joao',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(VALIDATION_CONFIG.MAX_SEARCH_LENGTH, {
    message: `Busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado (UF)',
    example: 'MG',
  })
  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  @Length(
    ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH,
    ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH,
    {
      message: `Estado deve ter ${ELETRICISTA_VALIDATION_CONFIG.UF_LENGTH} caracteres`,
    }
  )
  @Transform(({ value }) => value?.trim().toUpperCase())
  estado?: string;

  @ApiPropertyOptional({ description: 'Filtrar por contrato', example: 12 })
  @IsOptional()
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @IsPositive({ message: 'Contrato deve ser positivo' })
  @Type(() => Number)
  contratoId?: number;
}
