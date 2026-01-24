/**
 * DTO para resposta de listagem de tipos de veículo
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty } from '@nestjs/swagger';
import { TipoVeiculoResponseDto } from './tipo-veiculo-response.dto';

export class TipoVeiculoListResponseDto {
  @ApiProperty({ description: 'Lista de tipos de veículo', type: [TipoVeiculoResponseDto] })
  data: TipoVeiculoResponseDto[];

  @ApiProperty({ description: 'Metadados de paginação', type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
