import { ApiProperty } from '@nestjs/swagger';
import { TurnoResponseDto } from './turno-response.dto';

export class ListTurnosMetaDto {
  @ApiProperty({ description: 'Total de registros', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Página atual', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Itens por página', example: 20 })
  limit!: number;
}

/**
 * Payload retornado por GET /turno (campo `data` do envelope).
 */
export class ListTurnosResponseDto {
  @ApiProperty({
    description: 'Lista de turnos',
    type: [TurnoResponseDto],
  })
  items!: TurnoResponseDto[];

  @ApiProperty({
    description: 'Metadados de paginação',
    type: ListTurnosMetaDto,
  })
  meta!: ListTurnosMetaDto;
}
