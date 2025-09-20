/**
 * DTO para sincronização de equipes
 *
 * Define a estrutura de dados retornada para clientes mobile
 * que necessitam sincronizar a base completa de equipes
 * com informações de auditoria.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO para sincronização de equipes
 */
export class EquipeSyncDto {
  @ApiProperty({ description: 'ID da equipe', example: 101 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome da equipe', example: 'Equipe 1' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'ID do tipo de equipe', example: 1 })
  @IsNumber()
  @IsPositive()
  tipoEquipeId: number;

  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  contratoId: number;

  @ApiProperty({
    description: 'Data de criação da equipe',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário responsável pela criação da equipe',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Data da última atualização da equipe',
    example: '2024-01-20T09:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela última atualização da equipe',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Data da exclusão lógica da equipe',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela exclusão lógica da equipe',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
