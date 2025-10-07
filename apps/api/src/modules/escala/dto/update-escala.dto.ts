/**
 * DTO utilizado para atualização de escalas. Optamos por estender o DTO de
 * criação através de `PartialType` para herdar as mesmas validações quando
 * necessário, mantendo a documentação em um único ponto.
 */

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEscalaDto } from './create-escala.dto';

export class UpdateEscalaDto extends PartialType(CreateEscalaDto) {
  @ApiPropertyOptional({ description: 'Define se a escala permanece ativa' })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}
