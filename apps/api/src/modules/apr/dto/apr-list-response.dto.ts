/**
 * DTO para resposta de lista paginada de modelos APR
 *
 * Define a estrutura padronizada das respostas
 * que contêm listas paginadas de modelos APR.
 *
 * INCLUI:
 * - Array de modelos APR
 * - Metadados de paginação
 * - Informações de busca
 * - Estatísticas da consulta
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

import { AprResponseDto } from './apr-response.dto';

/**
 * DTO para resposta de lista paginada de modelos APR
 *
 * Define a estrutura padronizada das respostas
 * que contêm listas paginadas de modelos APR.
 *
 * INCLUI:
 * - Array de modelos APR
 * - Metadados de paginação
 * - Informações de busca
 * - Estatísticas da consulta
 */
export class AprListResponseDto {
  /**
   * Array de modelos APR (versão simplificada)
   */
  @ApiProperty({
    description: 'Lista de modelos APR',
    type: [AprResponseDto],
  })
  @IsArray()
  @Type(() => AprResponseDto)
  data: AprResponseDto[];

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
    example: 'soldagem',
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
