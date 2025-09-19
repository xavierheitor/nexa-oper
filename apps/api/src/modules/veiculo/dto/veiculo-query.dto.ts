/**
 * DTO para parâmetros de consulta de veículos
 *
 * Define e valida os parâmetros aceitos para consultas
 * de lista paginada de veículos.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { VALIDATION_CONFIG } from '../constants/veiculo.constants';

/**
 * DTO para parâmetros de consulta de veículos
 */
export class VeiculoQueryDto {
  /** Número da página */
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @IsPositive({ message: 'Página deve ser positiva' })
  @Type(() => Number)
  page?: number = 1;

  /** Itens por página */
  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite deve ser um número' })
  @IsPositive({ message: 'Limite deve ser positivo' })
  @Type(() => Number)
  limit?: number = 10;

  /** Termo de busca */
  @ApiPropertyOptional({
    description: 'Termo de busca (placa ou modelo)',
    example: 'ABC',
    maxLength: VALIDATION_CONFIG.MAX_SEARCH_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(VALIDATION_CONFIG.MAX_SEARCH_LENGTH, {
    message: `Busca deve ter no máximo ${VALIDATION_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  search?: string;

  /** Filtro por tipo de veículo */
  @ApiPropertyOptional({
    description: 'ID do tipo de veículo para filtrar',
    example: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Tipo de veículo deve ser um número inteiro' })
  @IsPositive({ message: 'Tipo de veículo deve ser positivo' })
  @Type(() => Number)
  tipoVeiculoId?: number;

  /** Filtro por contrato */
  @ApiPropertyOptional({
    description: 'ID do contrato para filtrar',
    example: 12,
  })
  @IsOptional()
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @IsPositive({ message: 'Contrato deve ser positivo' })
  @Type(() => Number)
  contratoId?: number;
}
