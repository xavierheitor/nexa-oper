import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnoResponseDto } from './turno-response.dto';

export class TurnoDetalheDto extends TurnoResponseDto {
  @ApiPropertyOptional({
    description: 'Identificação do dispositivo utilizado',
  })
  dispositivo?: string;

  @ApiPropertyOptional({ description: 'Versão do aplicativo' })
  versaoApp?: string;

  @ApiProperty({ description: 'Data/hora de criação' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data/hora de última atualização',
    nullable: true,
  })
  updatedAt!: Date | null;

  @ApiProperty({ description: 'Usuário que criou o registro' })
  createdBy!: string;

  @ApiProperty({
    description: 'Usuário que atualizou o registro',
    nullable: true,
  })
  updatedBy!: string | null;

  @ApiProperty({
    description: 'Participantes do turno',
    type: [Object],
  })
  eletricistas!: { eletricistaId: number; motorista: boolean }[];

  @ApiProperty({
    description: 'Checklists associados ao turno',
    type: [Object],
  })
  checklists!: unknown[];

  @ApiProperty({ description: 'Turnos realizados vinculados', type: [Object] })
  turnosRealizados!: unknown[];
}
