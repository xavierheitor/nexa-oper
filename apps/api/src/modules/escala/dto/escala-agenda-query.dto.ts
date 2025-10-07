/**
 * DTO que valida os parâmetros de geração da agenda de escala.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class EscalaAgendaQueryDto {
  @ApiPropertyOptional({
    description: 'Data inicial da agenda (inclusiva)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser válida' })
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final da agenda (inclusiva)',
    example: '2024-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser válida' })
  dataFim?: string;
}
