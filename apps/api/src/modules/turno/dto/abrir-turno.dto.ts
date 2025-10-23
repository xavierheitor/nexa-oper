/**
 * DTO para abertura de turno
 *
 * Este DTO define a estrutura de dados necessária
 * para abrir um novo turno no sistema.
 */

import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsArray,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsDateString,
  ArrayMinSize,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TURNO_VALIDATION_CONFIG } from '../constants/turno.constants';
import { SalvarChecklistPreenchidoDto } from './checklist-preenchido.dto';

/**
 * DTO para eletricista no turno
 */
export class EletricistaTurnoDto {
  /**
   * ID do eletricista
   * @example 1
   */
  @ApiProperty({
    description: 'ID do eletricista',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do eletricista é obrigatório' })
  @IsInt({ message: 'ID do eletricista deve ser um número inteiro' })
  eletricistaId: number;
}

/**
 * DTO para abertura de turno
 */
export class AbrirTurnoDto {
  /**
   * ID do veículo
   * @example 1
   */
  @ApiProperty({
    description: 'ID do veículo',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID do veículo é obrigatório' })
  @IsInt({ message: 'ID do veículo deve ser um número inteiro' })
  veiculoId: number;

  /**
   * ID da equipe
   * @example 1
   */
  @ApiProperty({
    description: 'ID da equipe',
    example: 1,
  })
  @IsNotEmpty({ message: 'ID da equipe é obrigatório' })
  @IsInt({ message: 'ID da equipe deve ser um número inteiro' })
  equipeId: number;

  /**
   * Identificação do dispositivo móvel
   * @example "SM-G973F-001"
   */
  @ApiProperty({
    description: 'Identificação do dispositivo móvel',
    example: 'SM-G973F-001',
    minLength: TURNO_VALIDATION_CONFIG.MIN_DISPOSITIVO_LENGTH,
    maxLength: TURNO_VALIDATION_CONFIG.MAX_DISPOSITIVO_LENGTH,
  })
  @IsNotEmpty({ message: 'Dispositivo é obrigatório' })
  @IsString({ message: 'Dispositivo deve ser uma string' })
  @MinLength(TURNO_VALIDATION_CONFIG.MIN_DISPOSITIVO_LENGTH, {
    message: `Dispositivo deve ter pelo menos ${TURNO_VALIDATION_CONFIG.MIN_DISPOSITIVO_LENGTH} caractere`,
  })
  @MaxLength(TURNO_VALIDATION_CONFIG.MAX_DISPOSITIVO_LENGTH, {
    message: `Dispositivo deve ter no máximo ${TURNO_VALIDATION_CONFIG.MAX_DISPOSITIVO_LENGTH} caracteres`,
  })
  dispositivo: string;

  /**
   * Data e hora de início do turno
   * @example "2024-01-01T08:00:00.000Z"
   */
  @ApiProperty({
    description: 'Data e hora de início do turno',
    example: '2024-01-01T08:00:00.000Z',
  })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  dataInicio: string;

  /**
   * Quilometragem do veículo no início do turno
   * @example 50000
   */
  @ApiProperty({
    description: 'Quilometragem do veículo no início do turno',
    example: 50000,
    minimum: TURNO_VALIDATION_CONFIG.MIN_KM,
    maximum: TURNO_VALIDATION_CONFIG.MAX_KM,
  })
  @IsNotEmpty({ message: 'Quilometragem de início é obrigatória' })
  @IsInt({ message: 'Quilometragem deve ser um número inteiro' })
  @Min(TURNO_VALIDATION_CONFIG.MIN_KM, {
    message: `Quilometragem deve ser no mínimo ${TURNO_VALIDATION_CONFIG.MIN_KM}`,
  })
  @Max(TURNO_VALIDATION_CONFIG.MAX_KM, {
    message: `Quilometragem deve ser no máximo ${TURNO_VALIDATION_CONFIG.MAX_KM}`,
  })
  kmInicio: number;

  /**
   * Lista de eletricistas do turno
   */
  @ApiProperty({
    description: 'Lista de eletricistas do turno',
    type: [EletricistaTurnoDto],
    minItems: 1,
  })
  @IsNotEmpty({ message: 'Lista de eletricistas é obrigatória' })
  @IsArray({ message: 'Eletricistas deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Pelo menos um eletricista é obrigatório' })
  eletricistas: EletricistaTurnoDto[];

  /**
   * Lista de checklists preenchidos (opcional)
   */
  @ApiProperty({
    description: 'Lista de checklists preenchidos (opcional)',
    type: [SalvarChecklistPreenchidoDto],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Checklists deve ser uma lista' })
  @ValidateNested({ each: true })
  @Type(() => SalvarChecklistPreenchidoDto)
  checklists?: SalvarChecklistPreenchidoDto[];
}
