/**
 * DTO para parâmetros de consulta de lista
 *
 * Define e valida os parâmetros aceitos
 * para consultas de lista paginada.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * DTO para parâmetros de consulta de lista
 *
 * Define e valida os parâmetros aceitos
 * para consultas de lista paginada.
 */
export class AprQueryDto {
  /**
   * Número da página
   */
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

  /**
   * Itens por página
   */
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

  /**
   * Termo de busca
   */
  @ApiPropertyOptional({
    description: 'Termo de busca por nome',
    example: 'soldagem',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(255, { message: 'Busca deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}
