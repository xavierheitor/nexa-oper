import { ApiProperty } from '@nestjs/swagger';
import type { TurnoStatusContract } from '../../../contracts/turno/turno.contract';

export class TurnoResponseDto {
  @ApiProperty({ description: 'ID do turno' })
  id!: number;

  @ApiProperty({ description: 'Data/hora de início do turno' })
  dataInicio!: Date;

  @ApiProperty({ description: 'Data/hora de fim do turno', nullable: true })
  dataFim!: Date | null;

  @ApiProperty({
    description:
      'Status derivado: ABERTO se dataFim null, FECHADO caso contrário',
  })
  status!: TurnoStatusContract;

  @ApiProperty({ description: 'Quilometragem inicial' })
  kmInicio!: number;

  @ApiProperty({ description: 'Quilometragem final', nullable: true })
  kmFim!: number | null;

  @ApiProperty({ description: 'Informações do veículo' })
  veiculo!: { id: number; nome: string };

  @ApiProperty({ description: 'Informações da equipe' })
  equipe!: { id: number; nome: string };
}
