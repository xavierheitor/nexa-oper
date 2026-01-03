/**
 * DTO para atualização de checklist existente
 *
 * Estende CreateChecklistDto tornando todos os campos opcionais
 * para permitir atualizações parciais.
 *
 * COMPORTAMENTO:
 * - Todos os campos são opcionais
 * - Mantém as mesmas validações quando fornecidos
 * - Permite atualizações incrementais
 *
 * @example
 * ```typescript
 * // Atualizar checklist existente
 * const updateDto: UpdateChecklistDto = {
 *   nome: 'Checklist Pré-Partida (Atualizado)'
 * };
 * ```
 */

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

import { CreateChecklistDto } from './create-checklist.dto';

/**
 * DTO para atualização de checklist existente
 */
export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {
  /**
   * Nome do checklist (opcional para atualização)
   */
  @ApiPropertyOptional({
    description: 'Nome do checklist',
    example: 'Checklist Pré-Partida (Atualizado)',
    minLength: 1,
    maxLength: 255,
  })
  nome?: string;

  /**
   * Tipo de checklist associado (opcional para atualização)
   */
  @ApiPropertyOptional({
    description: 'ID do tipo de checklist associado',
    example: 3,
    minimum: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: 'Tipo de checklist deve ser um número inteiro' })
  @IsPositive({ message: 'Tipo de checklist deve ser positivo' })
  tipoChecklistId?: number;
}
