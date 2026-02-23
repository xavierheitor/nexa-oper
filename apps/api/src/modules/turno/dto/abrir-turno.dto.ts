import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ChecklistPreenchidoItemDto } from './checklist-preenchido.dto';

export class EletricistaTurnoDto {
  @ApiProperty({ description: 'ID do eletricista', example: 42 })
  @IsInt()
  @IsPositive()
  eletricistaId!: number;

  @ApiPropertyOptional({ description: 'Se true, é o motorista do turno' })
  @IsOptional()
  motorista?: boolean;
}

export class AbrirTurnoDto {
  @ApiProperty({ description: 'ID do veículo', example: 1 })
  @IsInt()
  @IsPositive()
  veiculoId!: number;

  @ApiProperty({ description: 'ID da equipe', example: 10 })
  @IsInt()
  @IsPositive()
  equipeId!: number;

  @ApiPropertyOptional({
    description: 'Identificação do dispositivo',
    example: 'device-123',
  })
  @IsOptional()
  @IsString()
  dispositivo?: string;

  @ApiPropertyOptional({
    description: 'Versão do aplicativo',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  versaoApp?: string;

  @ApiProperty({ description: 'Quilometragem inicial', example: 12345 })
  @IsInt()
  @IsPositive()
  kmInicio!: number;

  @ApiPropertyOptional({
    description: 'Data/hora de início do turno (ISO)',
    example: '2025-12-31T08:00:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dataInicio?: Date;

  @ApiProperty({
    description: 'Lista de eletricistas que participarão do turno',
    type: [EletricistaTurnoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EletricistaTurnoDto)
  eletricistas!: EletricistaTurnoDto[];

  @ApiPropertyOptional({
    description:
      'Checklists preenchidos com respostas (abertura com checklist)',
    type: [ChecklistPreenchidoItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistPreenchidoItemDto)
  checklists?: ChecklistPreenchidoItemDto[];
}
