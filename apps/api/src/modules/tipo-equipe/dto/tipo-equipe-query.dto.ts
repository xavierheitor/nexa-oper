/**
 * DTO para parâmetros de consulta de tipos de equipe
 *
 * Define os parâmetros aceitos para filtrar e paginar
 * listagens de tipos de equipe.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ORDER_CONFIG, PAGINATION_CONFIG, SEARCH_CONFIG } from '../constants';

/**
 * Direções de ordenação permitidas
 */
export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO para parâmetros de consulta de tipos de equipe
 */
export class TipoEquipeQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (começando em 1)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @IsPositive({ message: 'Página deve ser um número positivo' })
  @Min(PAGINATION_CONFIG.DEFAULT_PAGE, {
    message: `Página deve ser no mínimo ${PAGINATION_CONFIG.DEFAULT_PAGE}`,
  })
  page?: number = PAGINATION_CONFIG.DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @IsPositive({ message: 'Limite deve ser um número positivo' })
  @Min(PAGINATION_CONFIG.MIN_LIMIT, {
    message: `Limite deve ser no mínimo ${PAGINATION_CONFIG.MIN_LIMIT}`,
  })
  @Max(PAGINATION_CONFIG.MAX_LIMIT, {
    message: `Limite deve ser no máximo ${PAGINATION_CONFIG.MAX_LIMIT}`,
  })
  limit?: number = PAGINATION_CONFIG.DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Campo para ordenação',
    example: 'nome',
    enum: ORDER_CONFIG.ALLOWED_ORDER_FIELDS,
  })
  @IsOptional()
  @IsString({ message: 'Campo de ordenação deve ser uma string' })
  @IsEnum(ORDER_CONFIG.ALLOWED_ORDER_FIELDS, {
    message: `Campo de ordenação deve ser um dos seguintes: ${ORDER_CONFIG.ALLOWED_ORDER_FIELDS.join(', ')}`,
  })
  orderBy?: string = ORDER_CONFIG.DEFAULT_ORDER_BY;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    example: 'asc',
    enum: OrderDirection,
  })
  @IsOptional()
  @IsEnum(OrderDirection, {
    message: 'Direção da ordenação deve ser "asc" ou "desc"',
  })
  orderDir?: OrderDirection = 'asc' as OrderDirection;

  @ApiPropertyOptional({
    description: 'Termo de busca textual (busca no nome)',
    example: 'Linha Viva',
    minLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH,
    maxLength: SEARCH_CONFIG.MAX_SEARCH_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Termo de busca deve ser uma string' })
  @MinLength(SEARCH_CONFIG.MIN_SEARCH_LENGTH, {
    message: `Termo de busca deve ter pelo menos ${SEARCH_CONFIG.MIN_SEARCH_LENGTH} caracteres`,
  })
  @MaxLength(SEARCH_CONFIG.MAX_SEARCH_LENGTH, {
    message: `Termo de busca deve ter no máximo ${SEARCH_CONFIG.MAX_SEARCH_LENGTH} caracteres`,
  })
  search?: string;
}
