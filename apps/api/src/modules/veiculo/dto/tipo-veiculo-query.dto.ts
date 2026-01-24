/**
 * DTO para parâmetros de consulta de tipos de veículo
 */

import {
  ORDER_CONFIG,
  PAGINATION_CONFIG,
  SEARCH_CONFIG,
} from '@common/constants/tipo-veiculo';
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

export enum OrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class TipoVeiculoQueryDto {
  @ApiPropertyOptional({ description: 'Página', example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(PAGINATION_CONFIG.DEFAULT_PAGE)
  page?: number = PAGINATION_CONFIG.DEFAULT_PAGE;

  @ApiPropertyOptional({ description: 'Itens por página', example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(PAGINATION_CONFIG.MIN_LIMIT)
  @Max(PAGINATION_CONFIG.MAX_LIMIT)
  limit?: number = PAGINATION_CONFIG.DEFAULT_LIMIT;

  @ApiPropertyOptional({ description: 'Campo de ordenação', enum: ORDER_CONFIG.ALLOWED_ORDER_FIELDS })
  @IsOptional()
  @IsString()
  @IsEnum(ORDER_CONFIG.ALLOWED_ORDER_FIELDS)
  orderBy?: string = ORDER_CONFIG.DEFAULT_ORDER_BY;

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: OrderDirection })
  @IsOptional()
  @IsEnum(OrderDirection)
  orderDir?: OrderDirection = 'asc' as OrderDirection;

  @ApiPropertyOptional({ description: 'Busca no nome', example: 'Caminhão', minLength: SEARCH_CONFIG.MIN_SEARCH_LENGTH, maxLength: SEARCH_CONFIG.MAX_SEARCH_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(SEARCH_CONFIG.MIN_SEARCH_LENGTH)
  @MaxLength(SEARCH_CONFIG.MAX_SEARCH_LENGTH)
  search?: string;
}
