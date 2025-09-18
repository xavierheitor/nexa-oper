/**
 * DTO para criação de novo modelo APR
 *
 * Define e valida os dados necessários para criar
 * um novo modelo de Análise Preliminar de Risco.
 *
 * VALIDAÇÕES:
 * - Nome obrigatório entre 1 e 255 caracteres
 * - Trimming automático de espaços
 * - Documentação Swagger automática
 *
 * @example
 * ```typescript
 * // Criar novo modelo APR
 * const createDto: CreateAprDto = {
 *   nome: "APR Soldagem Industrial"
 * };
 * ```
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para criação de novo modelo APR
 *
 * Define e valida os dados necessários para criar
 * um novo modelo de Análise Preliminar de Risco.
 *
 * VALIDAÇÕES:
 * - Nome obrigatório entre 1 e 255 caracteres
 * - Trimming automático de espaços
 * - Documentação Swagger automática
 */
export class CreateAprDto {
  /**
   * Nome do modelo APR
   *
   * Deve ser único e descritivo para identificar
   * claramente o propósito da análise de risco.
   */
  @ApiProperty({
    description: 'Nome do modelo APR',
    example: 'APR Soldagem Industrial',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(1, { message: 'Nome deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  nome: string;
}
