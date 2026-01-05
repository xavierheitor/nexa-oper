/**
 * DTO para atualização de equipe
 *
 * Este DTO define a estrutura de dados para atualizar
 * uma equipe existente no sistema. Todos os campos são opcionais.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
} from 'class-validator';

import { EQUIPE_VALIDATION_CONFIG } from '../constants/equipe.constants';

/**
 * DTO para atualização de equipe
 */
export class UpdateEquipeDto {
  /**
   * Nome da equipe
   * @example "Equipe Alpha Atualizada"
   */
  @ApiPropertyOptional({
    description: 'Nome da equipe',
    example: 'Equipe Alpha Atualizada',
    minLength: EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH,
    maxLength: EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter pelo menos ${EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  })
  @MaxLength(EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  nome?: string;

  /**
   * ID do tipo de equipe
   * @example 2
   */
  @ApiPropertyOptional({
    description: 'ID do tipo de equipe',
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'ID do tipo de equipe deve ser um número' })
  tipoEquipeId?: number;

  /**
   * ID do contrato
   * @example 2
   */
  @ApiPropertyOptional({
    description: 'ID do contrato',
    example: 2,
  })
  @IsOptional()
  @IsNumber({}, { message: 'ID do contrato deve ser um número' })
  contratoId?: number;
}
