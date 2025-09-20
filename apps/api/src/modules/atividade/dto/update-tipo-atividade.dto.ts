/**
 * DTO para atualização de tipo de atividade
 *
 * Este DTO define a estrutura de dados para atualizar
 * um tipo de atividade existente no sistema. Todos os campos são opcionais.
 */

import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ATIVIDADE_VALIDATION_CONFIG } from '../constants/atividade.constants';

/**
 * DTO para atualização de tipo de atividade
 */
export class UpdateTipoAtividadeDto {
  /**
   * Nome do tipo de atividade
   * @example "Soldagem Industrial"
   */
  @ApiPropertyOptional({
    description: 'Nome do tipo de atividade',
    example: 'Soldagem Industrial',
    minLength: ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH,
    maxLength: ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter pelo menos ${ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  })
  @MaxLength(ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  nome?: string;
}
