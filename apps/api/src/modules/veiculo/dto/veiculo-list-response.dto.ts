/**
 * DTO para resposta de lista paginada de veículos
 *
 * Define a estrutura padronizada das respostas
 * que contêm listas paginadas de veículos.
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

import { VeiculoResponseDto } from './veiculo-response.dto';

/**
 * DTO para resposta de lista paginada de veículos
 */
export class VeiculoListResponseDto {
  /** Lista de veículos retornados */
  @ApiProperty({ description: 'Lista de veículos', type: [VeiculoResponseDto] })
  @IsArray()
  @Type(() => VeiculoResponseDto)
  data: VeiculoResponseDto[];

  /** Metadados de paginação */
  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  /** Termo de busca utilizado (se houver) */
  @ApiPropertyOptional({
    description: 'Termo de busca utilizado na consulta',
    example: 'ABC',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /** Timestamp da resposta */
  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2024-05-01T12:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}
