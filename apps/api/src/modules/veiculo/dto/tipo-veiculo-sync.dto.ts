/**
 * DTO para sincronização de tipos de veículo
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class TipoVeiculoSyncDto {
  @ApiProperty({ description: 'ID do tipo de veículo', example: 1 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome do tipo de veículo', example: 'Caminhão Basculante' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Data de criação', example: '2024-01-15T10:30:00.000Z' })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Usuário responsável pela criação', example: 'user123' })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({ description: 'Data da última atualização' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
