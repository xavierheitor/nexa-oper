/**
 * Estrutura padronizada para respostas paginadas de escalas.
 */

import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { EscalaResponseDto } from './escala-response.dto';

export class EscalaListResponseDto {
  @ApiProperty({ type: [EscalaResponseDto], description: 'Lista de escalas' })
  data: EscalaResponseDto[];

  @ApiProperty({ description: 'Metadados de paginação' })
  meta: PaginationMetaDto;

  @ApiProperty({ description: 'Termo de busca aplicado', nullable: true })
  search: string | null;

  @ApiProperty({ description: 'Timestamp da consulta' })
  timestamp: Date;
}
