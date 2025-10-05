/**
 * DTO para resposta de listagem de tipos de equipe
 *
 * Define a estrutura de dados retornada em listagens
 * paginadas de tipos de equipe.
 */

import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { TipoEquipeResponseDto } from './tipo-equipe-response.dto';

/**
 * DTO para resposta de listagem de tipos de equipe
 */
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
