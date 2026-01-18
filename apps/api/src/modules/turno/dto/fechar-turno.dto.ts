/**
 * DTO para fechamento de turno
 *
 * Este DTO define a estrutura de dados necessária
 * para fechar um turno existente no sistema.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsInt, Min, Max, IsDateString } from 'class-validator';

import { TURNO_VALIDATION_CONFIG } from '@common/constants/turno';

/**
 * DTO para fechamento de turno
 */
export class FecharTurnoDto {
  /**
   * ID do turno a ser fechado
   * @example 1
   */
  @ApiProperty({
    description: 'ID do turno a ser fechado',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do turno é obrigatório' })
  @IsInt({ message: 'ID do turno deve ser um número inteiro' })
  turnoId: number;

  /**
   * Data e hora de fechamento do turno
   * @example "2024-01-01T17:00:00.000Z"
   */
  @ApiProperty({
    description: 'Data e hora de fechamento do turno',
    example: '2024-01-01T17:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Data de fechamento é obrigatória' })
  @IsDateString({}, { message: 'Data de fechamento deve ser uma data válida' })
  dataFim: string;

  /**
   * Quilometragem do veículo no fechamento do turno
   * @example 50120
   */
  @ApiProperty({
    description: 'Quilometragem do veículo no fechamento do turno',
    example: 50120,
    minimum: TURNO_VALIDATION_CONFIG.MIN_KM,
    maximum: TURNO_VALIDATION_CONFIG.MAX_KM,
  })
  @IsNotEmpty({ message: 'Quilometragem de fechamento é obrigatória' })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(TURNO_VALIDATION_CONFIG.MIN_KM, {
    message: `Quilometragem deve ser no mínimo ${TURNO_VALIDATION_CONFIG.MIN_KM}`,
  })
  @Max(TURNO_VALIDATION_CONFIG.MAX_KM, {
    message: `Quilometragem deve ser no máximo ${TURNO_VALIDATION_CONFIG.MAX_KM}`,
  })
  kmFim: number;
}
