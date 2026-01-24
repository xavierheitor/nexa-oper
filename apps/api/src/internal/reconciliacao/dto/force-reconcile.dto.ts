import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';

/**
 * DTO para forçar execução de reconciliação de turnos
 */
export class ForceReconcileDto {
  @ApiPropertyOptional({
    description:
      'Data de referência para reconciliação (formato: YYYY-MM-DD). Se não informado, usa hoje',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  dataReferencia?: string;

  @ApiPropertyOptional({
    description:
      'ID da equipe para reconciliar (opcional, se não informado processa todas as equipes)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  equipeId?: number;

  @ApiPropertyOptional({
    description: 'Intervalo de dias a partir da dataReferencia (padrão: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervaloDias?: number;

  @ApiPropertyOptional({
    description:
      'Se true, executa sem fazer alterações no banco (modo de teste)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;
}
