import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PeriodoTipo {
  MES = 'mes',
  TRIMESTRE = 'trimestre',
  CUSTOM = 'custom',
}

export class ConsolidadoEletricistaQueryDto {
  @ApiProperty({
    description: 'ID do eletricista',
    example: 1,
  })
  @Type(() => Number)
  eletricistaId: number;

  @ApiPropertyOptional({
    description: 'Tipo de período (mes, trimestre, custom)',
    enum: PeriodoTipo,
    default: PeriodoTipo.CUSTOM,
  })
  @IsOptional()
  @IsEnum(PeriodoTipo)
  periodo?: PeriodoTipo = PeriodoTipo.CUSTOM;

  @ApiPropertyOptional({
    description: 'Data inicial do período (ISO date string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({
    description: 'Data final do período (ISO date string)',
    example: '2024-01-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

