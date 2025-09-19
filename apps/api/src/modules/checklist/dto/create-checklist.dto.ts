/**
 * DTO para criação de novo checklist
 *
 * Define e valida os dados necessários para criar
 * um novo checklist de segurança.
 *
 * VALIDAÇÕES:
 * - Nome obrigatório entre 1 e 255 caracteres
 * - Tipo de checklist obrigatório e positivo
 * - Trimming automático de espaços
 * - Documentação Swagger automática
 *
 * @example
 * ```typescript
 * // Criar novo checklist
 * const createDto: CreateChecklistDto = {
 *   nome: 'Checklist Pré-Partida',
 *   tipoChecklistId: 3
 * };
 * ```
 */

import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para criação de novo checklist
 *
 * Define e valida os dados necessários para criar
 * um novo checklist de segurança.
 */
export class CreateChecklistDto {
  /**
   * Nome do checklist
   *
   * Deve ser único e descritivo para identificar
   * claramente o propósito da inspeção.
   */
  @ApiProperty({
    description: 'Nome do checklist',
    example: 'Checklist Pré-Partida',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(1, { message: 'Nome deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  nome: string;

  /**
   * Identificador do tipo de checklist
   */
  @ApiProperty({
    description: 'ID do tipo de checklist associado',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Tipo de checklist deve ser um número inteiro' })
  @IsPositive({ message: 'Tipo de checklist deve ser positivo' })
  tipoChecklistId: number;
}
