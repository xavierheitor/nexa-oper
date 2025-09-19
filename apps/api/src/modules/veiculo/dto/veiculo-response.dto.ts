/**
 * DTO para resposta de veículo individual
 *
 * Define a estrutura padronizada das respostas
 * que contêm dados de um veículo específico.
 *
 * INCLUI:
 * - Dados básicos do veículo
 * - Informações do tipo de veículo
 * - Dados resumidos do contrato
 * - Campos de auditoria completos
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * DTO auxiliar para informações do tipo de veículo
 */
export class VeiculoTipoVeiculoDto {
  @ApiProperty({ description: 'ID do tipo de veículo', example: 3 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome do tipo de veículo', example: 'Caminhão' })
  @IsString()
  nome: string;
}

/**
 * DTO auxiliar para informações resumidas do contrato
 */
export class VeiculoContratoDto {
  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: 'Nome do contrato',
    example: 'Contrato Mineração 2024',
  })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Número do contrato', example: 'CTR-000123' })
  @IsString()
  numero: string;
}

/**
 * DTO principal de resposta do veículo
 */
export class VeiculoResponseDto {
  /** ID do veículo */
  @ApiProperty({ description: 'ID único do veículo', example: 101 })
  @IsNumber()
  @IsPositive()
  id: number;

  /** Placa do veículo */
  @ApiProperty({ description: 'Placa do veículo', example: 'ABC1D23' })
  @IsString()
  placa: string;

  /** Modelo do veículo */
  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Caminhão Basculante',
  })
  @IsString()
  modelo: string;

  /** Ano do veículo */
  @ApiProperty({ description: 'Ano do veículo', example: 2024 })
  @IsInt()
  ano: number;

  /** ID do tipo de veículo */
  @ApiProperty({ description: 'ID do tipo de veículo associado', example: 5 })
  @IsNumber()
  @IsPositive()
  tipoVeiculoId: number;

  /** Dados resumidos do tipo de veículo */
  @ApiProperty({
    description: 'Informações do tipo de veículo associado',
    type: VeiculoTipoVeiculoDto,
  })
  @ValidateNested()
  @Type(() => VeiculoTipoVeiculoDto)
  tipoVeiculo: VeiculoTipoVeiculoDto;

  /** ID do contrato vinculado */
  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  contratoId: number;

  /** Dados resumidos do contrato */
  @ApiProperty({
    description: 'Informações do contrato vinculado',
    type: VeiculoContratoDto,
  })
  @ValidateNested()
  @Type(() => VeiculoContratoDto)
  contrato: VeiculoContratoDto;

  /** Data de criação do registro */
  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /** Usuário responsável pela criação */
  @ApiProperty({
    description: 'Usuário que criou o registro',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  /** Data da última atualização */
  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-02-01T08:15:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  /** Usuário da última atualização */
  @ApiPropertyOptional({
    description: 'Usuário que realizou a última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  /** Data de exclusão lógica */
  @ApiPropertyOptional({
    description: 'Data da exclusão lógica (soft delete)',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  /** Usuário responsável pela exclusão lógica */
  @ApiPropertyOptional({
    description: 'Usuário que realizou a exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
