/**
 * DTO para criação de tipos de equipe
 *
 * Define a estrutura de dados necessária para criar
 * um novo tipo de equipe no sistema.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { VALIDATION_CONFIG } from '../constants';

/**
 * DTO para criação de tipos de equipe
 */
export class CreateTipoEquipeDto {
  @ApiProperty({
    description: 'Nome do tipo de equipe',
    example: 'Linha Viva',
    minLength: VALIDATION_CONFIG.NOME_MIN_LENGTH,
    maxLength: VALIDATION_CONFIG.NOME_MAX_LENGTH,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(VALIDATION_CONFIG.NOME_MIN_LENGTH, {
    message: 'Nome deve ter pelo menos 2 caracteres',
  })
  @MaxLength(VALIDATION_CONFIG.NOME_MAX_LENGTH, {
    message: 'Nome deve ter no máximo 255 caracteres',
  })
  nome: string;
}
