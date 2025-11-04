import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export enum FaltaStatus {
  PENDENTE = 'pendente',
  JUSTIFICADA = 'justificada',
  INDEFERIDA = 'indeferida',
}

export class FaltaFilterDto {
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
    description: 'ID da equipe para filtrar',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  equipeId?: number;

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
    description: 'Status da falta',
    enum: FaltaStatus,
  })
  @IsOptional()
  @IsEnum(FaltaStatus)
  status?: FaltaStatus;

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

