/**
 * DTO para metadados de paginação
 *
 * Define informações sobre paginação utilizadas
 * em respostas de listas paginadas.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para metadados de paginação
 */
export class PaginationMetaDto {
  /**
   * Número total de itens
   */
  @ApiProperty({
    description: 'Número total de itens',
    example: 150,
  })
  @IsNumber()
  @IsInt()
  total: number;

  /**
   * Página atual
   */
  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  page: number;

  /**
   * Itens por página
   */
  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  limit: number;

  /**
   * Total de páginas
   */
  @ApiProperty({
    description: 'Total de páginas',
    example: 15,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  totalPages: number;

  /**
   * Indica se há página anterior
   */
  @ApiProperty({
    description: 'Indica se há página anterior',
    example: false,
  })
  hasPrevious: boolean;

  /**
   * Indica se há próxima página
   */
  @ApiProperty({
    description: 'Indica se há próxima página',
    example: true,
  })
  hasNext: boolean;
}
