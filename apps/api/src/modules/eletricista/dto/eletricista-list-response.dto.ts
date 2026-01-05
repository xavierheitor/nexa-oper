/**
 * DTO para resposta de lista paginada de eletricistas
 */

import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';

import { EletricistaResponseDto } from './eletricista-response.dto';

export class EletricistaListResponseDto {
  @ApiProperty({
    description: 'Coleção de eletricistas',
    type: [EletricistaResponseDto],
  })
  @IsArray()
  @Type(() => EletricistaResponseDto)
  data: EletricistaResponseDto[];

  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  @ApiPropertyOptional({
    description: 'Termo de busca utilizado',
    example: 'joao',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2024-05-01T12:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}
