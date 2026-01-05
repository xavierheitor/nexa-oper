import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class ReconciliarManualDto {
  @ApiProperty({
    description: 'Data de referência para reconciliação (formato: YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsString()
  @IsNotEmpty()
  dataReferencia: string;

  @ApiProperty({
    description:
      'ID da equipe para reconciliar (opcional se todasEquipes = true)',
    example: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  equipeId?: number;

  @ApiProperty({
    description:
      'Se true, executa reconciliação para todas as equipes com escala publicada na data',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  todasEquipes?: boolean;
}
