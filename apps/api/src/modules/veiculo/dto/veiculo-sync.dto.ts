/**
 * DTO para sincronização de veículos
 *
 * Define a estrutura de dados retornada para clientes mobile
 * que necessitam sincronizar a base completa de veículos
 * com informações de auditoria.
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
} from 'class-validator';

/**
 * DTO para sincronização de veículos
 */
export class VeiculoSyncDto {
  @ApiProperty({ description: 'ID do veículo', example: 101 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Placa do veículo', example: 'ABC1D23' })
  @IsString()
  placa: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Caminhão Basculante',
  })
  @IsString()
  modelo: string;

  @ApiProperty({ description: 'Ano do veículo', example: 2024 })
  @IsInt()
  ano: number;

  @ApiProperty({ description: 'ID do tipo de veículo', example: 5 })
  @IsNumber()
  @IsPositive()
  tipoVeiculoId: number;

  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  contratoId: number;

  @ApiProperty({
    description: 'Data de criação do veículo',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário responsável pela criação',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-02-01T08:15:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Data da exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
