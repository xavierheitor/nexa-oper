/**
 * DTO para resposta de checklist individual
 *
 * Define a estrutura padronizada das respostas
 * que contêm dados de um checklist específico.
 *
 * INCLUI:
 * - Dados básicos do checklist
 * - Tipo de checklist associado
 * - Informações de auditoria
 * - Timestamps formatados
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * DTO auxiliar para o tipo de checklist associado
 */
export class ChecklistTipoChecklistDto {
  @ApiProperty({ description: 'ID do tipo de checklist', example: 3 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: 'Nome do tipo de checklist',
    example: 'Veículos',
  })
  @IsString()
  nome: string;
}

/**
 * DTO para resposta de checklist individual
 */
export class ChecklistResponseDto {
  /**
   * ID único do checklist
   */
  @ApiProperty({
    description: 'ID único do checklist',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  id: number;

  /**
   * Nome do checklist
   */
  @ApiProperty({
    description: 'Nome do checklist',
    example: 'Checklist Pré-Partida',
  })
  @IsString()
  nome: string;

  /**
   * ID do tipo de checklist associado
   */
  @ApiProperty({
    description: 'ID do tipo de checklist associado',
    example: 3,
  })
  @IsNumber()
  @IsPositive()
  tipoChecklistId: number;

  /**
   * Dados resumidos do tipo de checklist
   */
  @ApiProperty({
    description: 'Informações do tipo de checklist associado',
    type: ChecklistTipoChecklistDto,
  })
  @ValidateNested()
  @Type(() => ChecklistTipoChecklistDto)
  tipoChecklist: ChecklistTipoChecklistDto;

  /**
   * Data de criação do checklist
   */
  @ApiProperty({
    description: 'Data de criação do checklist',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Usuário que criou o checklist
   */
  @ApiProperty({
    description: 'Usuário que criou o checklist',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  /**
   * Data da última atualização (opcional)
   */
  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-01-16T14:45:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  /**
   * Usuário que fez a última atualização (opcional)
   */
  @ApiPropertyOptional({
    description: 'Usuário que fez a última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  /**
   * Data de exclusão lógica (opcional)
   */
  @ApiPropertyOptional({
    description: 'Data de exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  /**
   * Usuário que fez a exclusão lógica (opcional)
   */
  @ApiPropertyOptional({
    description: 'Usuário que fez a exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
