/**
 * DTO para atualização de veículo existente
 *
 * Estende CreateVeiculoDto tornando todos os campos opcionais,
 * permitindo atualizações parciais com as mesmas validações.
 *
 * @example
 * ```typescript
 * const dto: UpdateVeiculoDto = {
 *   modelo: 'Caminhão Basculante XL',
 * };
 * ```
 */

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive } from 'class-validator';

import { CreateVeiculoDto } from './create-veiculo.dto';

/**
 * DTO para atualização de veículo existente
 */
export class UpdateVeiculoDto extends PartialType(CreateVeiculoDto) {
  /**
   * Identificador opcional de tipo de veículo para atualização
   */
  @ApiPropertyOptional({
    description: 'ID do tipo de veículo associado',
    example: 8,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Tipo de veículo deve ser um número inteiro' })
  @IsPositive({ message: 'Tipo de veículo deve ser positivo' })
  override tipoVeiculoId?: number;

  /**
   * Identificador opcional do contrato vinculado
   */
  @ApiPropertyOptional({
    description: 'ID do contrato ao qual o veículo está vinculado',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @IsPositive({ message: 'Contrato deve ser positivo' })
  override contratoId?: number;
}
