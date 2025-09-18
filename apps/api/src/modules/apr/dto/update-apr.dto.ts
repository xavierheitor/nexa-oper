/**
 * DTO para atualização de modelo APR existente
 *
 * Estende CreateAprDto tornando todos os campos opcionais
 * para permitir atualizações parciais.
 *
 * COMPORTAMENTO:
 * - Todos os campos são opcionais
 * - Mantém as mesmas validações quando fornecidos
 * - Permite atualizações incrementais
 *
 * @example
 * ```typescript
 * // Atualizar modelo existente
 * const updateDto: UpdateAprDto = {
 *   nome: "APR Soldagem Industrial Atualizada"
 * };
 * ```
 */

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateAprDto } from './create-apr.dto';

/**
 * DTO para atualização de modelo APR existente
 *
 * Estende CreateAprDto tornando todos os campos opcionais
 * para permitir atualizações parciais.
 *
 * COMPORTAMENTO:
 * - Todos os campos são opcionais
 * - Mantém as mesmas validações quando fornecidos
 * - Permite atualizações incrementais
 */
export class UpdateAprDto extends PartialType(CreateAprDto) {
  /**
   * Nome do modelo APR (opcional para atualização)
   */
  @ApiPropertyOptional({
    description: 'Nome do modelo APR',
    example: 'APR Soldagem Industrial Atualizada',
    minLength: 1,
    maxLength: 255,
  })
  nome?: string;
}
