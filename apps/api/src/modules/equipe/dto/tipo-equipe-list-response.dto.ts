/**
 * DTO para resposta de listagem de tipos de equipe
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';

import { TipoEquipeResponseDto } from './tipo-equipe-response.dto';

export class TipoEquipeListResponseDto {
  @ApiProperty({
    description: 'Lista de tipos de equipe',
    type: [TipoEquipeResponseDto],
  })
  data: TipoEquipeResponseDto[];

  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
