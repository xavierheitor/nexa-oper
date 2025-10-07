/**
 * DTO responsável por validar os filtros de listagem de escalas. A paginação
 * segue o mesmo padrão adotado nos demais módulos para manter a experiência
 * consistente entre as telas do painel administrativo.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ESCALA_PAGINATION_CONFIG } from '../constants';

export class EscalaQueryDto {
  @ApiPropertyOptional({ description: 'Página desejada', default: 1 })
  @IsOptional()
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página mínima é 1' })
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página', default: 10 })
  @IsOptional()
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite mínimo é 1' })
  @Max(ESCALA_PAGINATION_CONFIG.MAX_LIMIT, {
    message: `Limite máximo permitido é ${ESCALA_PAGINATION_CONFIG.MAX_LIMIT}`,
  })
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca por nome ou código' })
  @IsOptional()
  @IsString({ message: 'Busca deve ser texto' })
  search?: string;

  @ApiPropertyOptional({ description: 'Filtro por contrato' })
  @IsOptional()
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @Min(1, { message: 'Contrato inválido' })
  contratoId?: number;

  @ApiPropertyOptional({ description: 'Considerar apenas escalas ativas' })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
