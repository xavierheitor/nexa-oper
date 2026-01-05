/**
 * DTO para resposta de listagem de equipes
 *
 * Este DTO define a estrutura de dados retornada
 * quando uma lista de equipes é consultada no sistema.
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

import { EquipeResponseDto } from './equipe-response.dto';

/**
 * DTO para resposta de listagem de equipes
 */
export class EquipeListResponseDto {
  /**
   * Lista de equipes
   */
  @ApiProperty({
    description: 'Lista de equipes',
    type: [EquipeResponseDto],
  })
  data: EquipeResponseDto[];

  /**
   * Metadados de paginação
   */
  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  /**
   * Termo de busca utilizado
   */
  @ApiProperty({
    description: 'Termo de busca utilizado',
    example: 'Alpha',
    nullable: true,
  })
  search?: string;

  /**
   * Timestamp da consulta
   */
  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: Date;
}
