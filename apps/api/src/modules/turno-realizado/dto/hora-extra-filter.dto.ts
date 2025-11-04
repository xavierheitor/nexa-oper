import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export enum HoraExtraTipo {
  FOLGA_TRABALHADA = 'folga_trabalhada',
  EXTRAFORA = 'extrafora',
  ATRASO_COMPENSADO = 'atraso_compensado',
  TROCA_FOLGA = 'troca_folga',
}

export enum HoraExtraStatus {
  PENDENTE = 'pendente',
  APROVADA = 'aprovada',
  REJEITADA = 'rejeitada',
}

export class HoraExtraFilterDto {
  @ApiPropertyOptional({
    description: 'ID do eletricista para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  eletricistaId?: number;

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

  @ApiPropertyOptional({
    description: 'Tipo de hora extra',
    enum: HoraExtraTipo,
  })
  @IsOptional()
  @IsEnum(HoraExtraTipo)
  tipo?: HoraExtraTipo;

  @ApiPropertyOptional({
    description: 'Status da hora extra',
    enum: HoraExtraStatus,
  })
  @IsOptional()
  @IsEnum(HoraExtraStatus)
  status?: HoraExtraStatus;

  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 20,
    default: 20,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  pageSize?: number = 20;
}

