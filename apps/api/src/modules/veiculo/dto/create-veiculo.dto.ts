/**
 * DTO para criação de novo veículo
 *
 * Define e valida os dados necessários para criar
 * um novo veículo na base de dados.
 *
 * VALIDAÇÕES:
 * - Placa obrigatória entre 1 e 8 caracteres
 * - Modelo obrigatório entre 1 e 255 caracteres
 * - Ano obrigatório dentro do intervalo permitido
 * - Tipo de veículo e contrato obrigatórios
 * - Trimming automático de strings
 * - Documentação Swagger automática
 *
 * @example
 * ```typescript
 * const dto: CreateVeiculoDto = {
 *   placa: 'ABC1D23',
 *   modelo: 'Caminhão Basculante',
 *   ano: 2024,
 *   tipoVeiculoId: 5,
 *   contratoId: 12,
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
  Max,
  Min,
} from 'class-validator';

import { VEICULO_VALIDATION_CONFIG } from '../constants/veiculo.constants';

/**
 * DTO para criação de novo veículo
 */
export class CreateVeiculoDto {
  /**
   * Placa do veículo
   */
  @ApiProperty({
    description: 'Placa do veículo (sem máscara)',
    example: 'ABC1D23',
    minLength: VEICULO_VALIDATION_CONFIG.MIN_PLACA_LENGTH,
    maxLength: VEICULO_VALIDATION_CONFIG.MAX_PLACA_LENGTH,
  })
  @IsString({ message: 'Placa deve ser uma string' })
  @IsNotEmpty({ message: 'Placa é obrigatória' })
  @MinLength(VEICULO_VALIDATION_CONFIG.MIN_PLACA_LENGTH, {
    message: `Placa deve ter pelo menos ${VEICULO_VALIDATION_CONFIG.MIN_PLACA_LENGTH} caractere`,
  })
  @MaxLength(VEICULO_VALIDATION_CONFIG.MAX_PLACA_LENGTH, {
    message: `Placa deve ter no máximo ${VEICULO_VALIDATION_CONFIG.MAX_PLACA_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim().toUpperCase())
  placa: string;

  /**
   * Modelo do veículo
   */
  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Caminhão Basculante',
    minLength: VEICULO_VALIDATION_CONFIG.MIN_MODELO_LENGTH,
    maxLength: VEICULO_VALIDATION_CONFIG.MAX_MODELO_LENGTH,
  })
  @IsString({ message: 'Modelo deve ser uma string' })
  @IsNotEmpty({ message: 'Modelo é obrigatório' })
  @MinLength(VEICULO_VALIDATION_CONFIG.MIN_MODELO_LENGTH, {
    message: `Modelo deve ter pelo menos ${VEICULO_VALIDATION_CONFIG.MIN_MODELO_LENGTH} caractere`,
  })
  @MaxLength(VEICULO_VALIDATION_CONFIG.MAX_MODELO_LENGTH, {
    message: `Modelo deve ter no máximo ${VEICULO_VALIDATION_CONFIG.MAX_MODELO_LENGTH} caracteres`,
  })
  @Transform(({ value }) => value?.trim())
  modelo: string;

  /**
   * Ano do veículo
   */
  @ApiProperty({
    description: 'Ano de fabricação do veículo',
    example: 2024,
    minimum: VEICULO_VALIDATION_CONFIG.MIN_ANO,
    maximum: VEICULO_VALIDATION_CONFIG.MAX_ANO,
  })
  @Type(() => Number)
  @IsInt({ message: 'Ano deve ser um número inteiro' })
  @Min(VEICULO_VALIDATION_CONFIG.MIN_ANO, {
    message: `Ano deve ser no mínimo ${VEICULO_VALIDATION_CONFIG.MIN_ANO}`,
  })
  @Max(VEICULO_VALIDATION_CONFIG.MAX_ANO, {
    message: `Ano deve ser no máximo ${VEICULO_VALIDATION_CONFIG.MAX_ANO}`,
  })
  ano: number;

  /**
   * Identificador do tipo de veículo
   */
  @ApiProperty({
    description: 'ID do tipo de veículo associado',
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Tipo de veículo deve ser um número inteiro' })
  @IsPositive({ message: 'Tipo de veículo deve ser positivo' })
  tipoVeiculoId: number;

  /**
   * Identificador do contrato vinculado ao veículo
   */
  @ApiProperty({
    description: 'ID do contrato ao qual o veículo está vinculado',
    example: 12,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Contrato deve ser um número inteiro' })
  @IsPositive({ message: 'Contrato deve ser positivo' })
  contratoId: number;
}
