/**
 * DTO para fechamento de turno via app móvel
 *
 * Este DTO define a estrutura específica dos dados enviados
 * pelo aplicativo móvel para fechamento de turno.
 */

import { IsNotEmpty, IsInt, IsNumber, IsString, IsOptional, IsNumberString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

/**
 * DTO para fechamento de turno via mobile
 */
export class MobileFecharTurnoDto {
  @ApiProperty({
    description: 'ID do turno a ser fechado',
    example: 3
  })
  @IsNotEmpty()
  @IsInt()
  turnoId: number;

  @ApiProperty({
    description: 'Quilometragem final do veículo',
    example: 3000
  })
  @IsNotEmpty()
  @IsNumber()
  kmFinal: number;

  @ApiProperty({
    description: 'Latitude do local de fechamento',
    example: -23.5505,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value === null || value === undefined ? undefined : Number(value))
  @IsNumber({}, { message: 'Latitude deve ser um número válido' })
  latitude?: number;

  @ApiProperty({
    description: 'Longitude do local de fechamento',
    example: -46.6333,
    required: false
  })
  @IsOptional()
  @Transform(({ value }) => value === null || value === undefined ? undefined : Number(value))
  @IsNumber({}, { message: 'Longitude deve ser um número válido' })
  longitude?: number;

  @ApiProperty({
    description: 'Data e hora de fechamento do turno',
    example: '2025-10-22T21:39:50.334880Z'
  })
  @IsNotEmpty()
  @IsString()
  horaFim: string;
}

/**
 * DTO de resposta para fechamento de turno via mobile
 */
export class MobileFecharTurnoResponseDto {
  @ApiProperty({ description: 'Indica se a operação foi bem-sucedida' })
  success: boolean;

  @ApiProperty({ description: 'Mensagem de resposta' })
  message: string;

  @ApiProperty({ description: 'Dados do turno fechado' })
  data: {
    id: number;
    dataSolicitacao: string;
    dataInicio: string;
    dataFim: string;
    veiculoId: number;
    veiculoPlaca: string;
    veiculoModelo: string;
    equipeId: number;
    equipeNome: string;
    dispositivo: string;
    kmInicio: number;
    kmFim: number;
    status: string;
    eletricistas: any[];
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    deletedAt: string | null;
    deletedBy: string | null;
  };

  @ApiProperty({ description: 'ID local do turno (para referência mobile)' })
  turnoLocalId?: number;

  @ApiProperty({ description: 'ID remoto do turno' })
  remoteId: number;

  @ApiProperty({ description: 'Timestamp da operação' })
  timestamp: string;
}
