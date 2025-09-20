/**
 * DTO para criação de equipe
 *
 * Este DTO define a estrutura de dados necessária
 * para criar uma nova equipe no sistema.
 */

import { IsNotEmpty, IsString, IsNumber, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EQUIPE_VALIDATION_CONFIG } from '../constants/equipe.constants';

/**
 * DTO para criação de equipe
 */
export class CreateEquipeDto {
  /**
   * Nome da equipe
   * @example "Equipe Alpha"
   */
  @ApiProperty({
    description: 'Nome da equipe',
    example: 'Equipe Alpha',
    minLength: EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH,
    maxLength: EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH,
  })
  @IsNotEmpty({ message: 'Nome da equipe é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH, {
    message: `Nome deve ter pelo menos ${EQUIPE_VALIDATION_CONFIG.MIN_NOME_LENGTH} caractere`,
  })
  @MaxLength(EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH, {
    message: `Nome deve ter no máximo ${EQUIPE_VALIDATION_CONFIG.MAX_NOME_LENGTH} caracteres`,
  })
  nome: string;

  /**
   * ID do tipo de equipe
   * @example 1
   */
  @ApiProperty({
    description: 'ID do tipo de equipe',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do tipo de equipe é obrigatório' })
  @IsNumber({}, { message: 'ID do tipo de equipe deve ser um número' })
  tipoEquipeId: number;

  /**
   * ID do contrato
   * @example 1
   */
  @ApiProperty({
    description: 'ID do contrato',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do contrato é obrigatório' })
  @IsNumber({}, { message: 'ID do contrato deve ser um número' })
  contratoId: number;
}
