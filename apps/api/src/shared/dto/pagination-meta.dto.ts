/**
 * DTO para metadados de paginação
 *
 * Estrutura padronizada para informações de paginação
 * em respostas de listagem paginada.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsPositive } from 'class-validator';

/**
 * DTO para metadados de paginação
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total de registros encontrados',
    example: 150,
  })
  @IsInt()
  @IsPositive()
  total: number;

  @ApiProperty({
    description: 'Página atual',
    example: 2,
  })
  @IsInt()
  @IsPositive()
  page: number;

  @ApiProperty({
    description: 'Limite de registros por página',
    example: 10,
  })
  @IsInt()
  @IsPositive()
  limit: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 15,
  })
  @IsInt()
  @IsPositive()
  totalPages: number;

  @ApiProperty({
    description: 'Indica se existe página anterior',
    example: true,
  })
  @IsBoolean()
  hasPrevious: boolean;

  @ApiProperty({
    description: 'Indica se existe próxima página',
    example: true,
  })
  @IsBoolean()
  hasNext: boolean;
}
