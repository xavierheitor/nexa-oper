/**
 * DTO para resposta de listagem de tipos de atividade
 *
 * Este DTO define a estrutura de dados retornada
 * quando uma lista de tipos de atividade é consultada no sistema.
 */

import { ApiProperty } from '@nestjs/swagger';
import { TipoAtividadeResponseDto } from './tipo-atividade-response.dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

/**
 * DTO para resposta de listagem de tipos de atividade
 */
export class TipoAtividadeListResponseDto {
  /**
   * Lista de tipos de atividade
   */
  @ApiProperty({
    description: 'Lista de tipos de atividade',
    type: [TipoAtividadeResponseDto],
  })
  data: TipoAtividadeResponseDto[];

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
    example: 'Soldagem',
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
