/**
 * DTO para parâmetros de consulta de turnos
 *
 * Este DTO define os parâmetros aceitos para consultas
 * de turnos, incluindo paginação e filtros.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

import { PAGINATION_CONFIG } from '@common/constants/turno';

/**
 * DTO para parâmetros de consulta de turnos
 */
export class TurnoQueryDto {
  /**
   * Página da consulta
   * @default 1
   */
  @ApiPropertyOptional({
    description: 'Página da consulta',
    example: 1,
    minimum: 1,
    default: PAGINATION_CONFIG.DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  page?: number = PAGINATION_CONFIG.DEFAULT_PAGE;

  /**
   * Limite de registros por página
   * @default 10
   */
  @ApiPropertyOptional({
    description: 'Limite de registros por página',
    example: 10,
    minimum: 1,
    maximum: PAGINATION_CONFIG.MAX_LIMIT,
    default: PAGINATION_CONFIG.DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser maior que 0' })
  @Max(PAGINATION_CONFIG.MAX_LIMIT, {
    message: `Limite deve ser no máximo ${PAGINATION_CONFIG.MAX_LIMIT}`,
  })
  limit?: number = PAGINATION_CONFIG.DEFAULT_LIMIT;

  /**
   * Termo de busca (placa do veículo, nome da equipe, etc.)
   */
  @ApiPropertyOptional({
    description: 'Termo de busca para filtrar turnos',
    example: 'ABC1234',
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  /**
   * ID do veículo para filtrar
   */
  @ApiPropertyOptional({
    description: 'ID do veículo para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId?: number;

  /**
   * ID da equipe para filtrar
   */
  @ApiPropertyOptional({
    description: 'ID da equipe para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID da equipe deve ser um número inteiro' })
  equipeId?: number;

  /**
   * ID do eletricista para filtrar
   */
  @ApiPropertyOptional({
    description: 'ID do eletricista para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID do eletricista deve ser um número inteiro' })
  eletricistaId?: number;

  /**
   * Status do turno para filtrar
   */
  @ApiPropertyOptional({
    description: 'Status do turno para filtrar',
    example: 'ABERTO',
    enum: ['ABERTO', 'FECHADO', 'CANCELADO'],
  })
  @IsOptional()
  @IsString({ message: 'Status deve ser uma string' })
  status?: string;

  /**
   * Data de início para filtrar (formato ISO)
   */
  @ApiPropertyOptional({
    description: 'Data de início para filtrar (formato ISO)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  dataInicio?: string;

  /**
   * Data de fim para filtrar (formato ISO)
   */
  @ApiPropertyOptional({
    description: 'Data de fim para filtrar (formato ISO)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de fim deve ser uma data válida' })
  dataFim?: string;
}
