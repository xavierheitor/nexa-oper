/**
 * DTO para resposta de lista paginada de checklists
 *
 * Define a estrutura padronizada das respostas
 * que contêm listas paginadas de checklists.
 *
 * INCLUI:
 * - Array de checklists
 * - Metadados de paginação
 * - Informações de busca
 * - Estatísticas da consulta
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';
import { ChecklistResponseDto } from './checklist-response.dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

/**
 * DTO para resposta de lista paginada de checklists
 */
export class ChecklistListResponseDto {
  /**
   * Array de checklists (versão resumida)
   */
  @ApiProperty({
    description: 'Lista de checklists',
    type: [ChecklistResponseDto],
  })
  @IsArray()
  @Type(() => ChecklistResponseDto)
  data: ChecklistResponseDto[];

  /**
   * Metadados de paginação
   */
  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  /**
   * Termo de busca utilizado (opcional)
   */
  @ApiPropertyOptional({
    description: 'Termo de busca utilizado',
    example: 'pré-partida',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Timestamp da consulta
   */
  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}
