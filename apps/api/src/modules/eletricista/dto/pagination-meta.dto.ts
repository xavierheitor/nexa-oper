/**
 * DTO para metadados de paginação do módulo Eletricista
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsPositive } from 'class-validator';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Número total de itens', example: 42 })
  @IsNumber()
  @IsInt()
  total: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  page: number;

  @ApiProperty({ description: 'Itens por página', example: 10 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  limit: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  @IsNumber()
  @IsInt()
  @IsPositive()
  totalPages: number;

  @ApiProperty({ description: 'Indica se há página anterior', example: false })
  @IsBoolean()
  hasPrevious: boolean;

  @ApiProperty({ description: 'Indica se há próxima página', example: true })
  @IsBoolean()
  hasNext: boolean;
}
