import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/** Status do turno para filtro na listagem. */
export enum TurnoStatus {
  ABERTO = 'ABERTO',
  FECHADO = 'FECHADO',
}

export class TurnoQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página (default: 1)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Tamanho da página (default: 20)',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID do veículo', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  veiculoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID da equipe', example: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  equipeId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ID do eletricista',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  eletricistaId?: number;

  @ApiPropertyOptional({
    description: 'Filtrar pelo status (ABERTO/FECHADO)',
    enum: TurnoStatus,
    example: TurnoStatus.ABERTO,
  })
  @IsOptional()
  @IsEnum(TurnoStatus)
  status?: TurnoStatus;

  @ApiPropertyOptional({
    description: 'Data início mínima (ISO)',
    example: '2025-12-01',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataInicioFrom?: Date;

  @ApiPropertyOptional({
    description: 'Data início máxima (ISO)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataInicioTo?: Date;

  @ApiPropertyOptional({
    description: 'Termo de busca (placa ou nome equipe)',
    example: 'ABC',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
