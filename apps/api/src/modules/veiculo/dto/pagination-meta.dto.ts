/**
 * DTO para metadados de paginação
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para metadados de paginação
 */
export class PaginationMetaDto {
  /** Total de itens encontrados */
  @ApiProperty({ description: 'Número total de itens', example: 150 })
  @IsNumber()
  @IsInt()
  total: number;

  /** Página atual */
  @ApiProperty({ description: 'Página atual', example: 1 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  page: number;

  /** Itens por página */
  @ApiProperty({ description: 'Itens por página', example: 10 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  limit: number;

  /** Total de páginas disponíveis */
  @ApiProperty({ description: 'Total de páginas', example: 15 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  totalPages: number;

  /** Indica se existe página anterior */
  @ApiProperty({ description: 'Indica se há página anterior', example: false })
  @IsBoolean()
  hasPrevious: boolean;

  /** Indica se existe próxima página */
  @ApiProperty({ description: 'Indica se há próxima página', example: true })
  @IsBoolean()
  hasNext: boolean;
}
