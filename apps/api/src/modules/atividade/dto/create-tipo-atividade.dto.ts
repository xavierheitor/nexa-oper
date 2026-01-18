/**
 * DTO para criação de tipo de atividade
 *
 * Este DTO define a estrutura de dados necessária
 * para criar um novo tipo de atividade no sistema.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

import { ATIVIDADE_VALIDATION_CONFIG } from '@common/constants/atividade';

/**
 * DTO para criação de tipo de atividade
 */
export class CreateTipoAtividadeDto {
  /**
   * Nome do tipo de atividade
   * @example "Soldagem"
   */
  @ApiProperty({
    description: 'Nome do tipo de atividade',
    example: 'Soldagem',
    minLength: ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH,
    maxLength: ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH,
  })
  @IsNotEmpty({ message: 'Nome do tipo de atividade é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter pelo menos ${ATIVIDADE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  })
  @MaxLength(ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${ATIVIDADE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  nome: string;
}
