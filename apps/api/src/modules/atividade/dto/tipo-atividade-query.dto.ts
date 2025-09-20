/**
 * DTO para parâmetros de consulta de tipos de atividade
 *
 * Este DTO define os parâmetros aceitos para consultas
 * de tipos de atividade, incluindo paginação e busca.
 */

import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_CONFIG } from '../constants/atividade.constants';

/**
 * DTO para parâmetros de consulta de tipos de atividade
 */
export class TipoAtividadeQueryDto {
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
   * Termo de busca
   */
  @ApiPropertyOptional({
    description: 'Termo de busca para filtrar tipos de atividade',
    example: 'Soldagem',
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}
