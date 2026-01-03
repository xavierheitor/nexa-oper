/**
 * DTO para resposta de listagem de turnos
 *
 * Este DTO define a estrutura de dados retornada
 * quando uma lista de turnos é consultada no sistema.
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

import { TurnoResponseDto } from './turno-response.dto';

/**
 * DTO para resposta de listagem de turnos
 */
export class TurnoListResponseDto {
  /**
   * Lista de turnos
   */
  @ApiProperty({
    description: 'Lista de turnos',
    type: [TurnoResponseDto],
  })
  data: TurnoResponseDto[];

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
    example: 'ABC1234',
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
