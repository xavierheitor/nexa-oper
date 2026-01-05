/**
 * DTO para upload de localizações pelo aplicativo mobile.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsISO8601,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class LocationUploadDto {
  @ApiProperty({
    description: 'Identificador local do turno no aplicativo',
    example: 321,
  })
  @Type(() => Number)
  @IsInt()
  turnoId!: number;

  @ApiProperty({
    description: 'Latitude capturada pelo dispositivo',
    example: -19.12345,
  })
  @Type(() => Number)
  @IsNumber()
  latitude!: number;

  @ApiProperty({
    description: 'Longitude capturada pelo dispositivo',
    example: -43.98765,
  })
  @Type(() => Number)
  @IsNumber()
  longitude!: number;

  @ApiPropertyOptional({
    description: 'Identificador remoto do veículo associado',
    example: 456,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  veiculoRemoteId?: number;

  @ApiPropertyOptional({
    description: 'Identificador remoto da equipe associada',
    example: 789,
  })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipeRemoteId?: number;

  @ApiPropertyOptional({
    description: 'Precisão da leitura em metros',
    example: 10.5,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  accuracy?: number;

  @ApiPropertyOptional({
    description: 'Fonte de localização informada pelo dispositivo',
    example: 'gps',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({
    description: 'Nível de bateria do dispositivo (0 a 100)',
    example: 78,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  batteryLevel?: number;

  @ApiPropertyOptional({
    description: 'Tipo da marcação enviada pelo aplicativo',
    example: 'periodic',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  tagType?: string;

  @ApiPropertyOptional({
    description: 'Detalhes adicionais da marcação',
    example: 'ronda noturna',
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  tagDetail?: string;

  @ApiPropertyOptional({
    description: 'Data/hora ISO da captura da posição',
    example: '2025-10-26T16:20:01.000Z',
  })
  @IsString()
  @IsNotEmpty()
  @IsISO8601()
  @IsOptional()
  capturedAt?: string;
}
