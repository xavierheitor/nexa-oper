/**
 * DTO para resposta de eletricista individual
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

class EletricistaContratoDto {
  @ApiProperty({ description: 'ID do contrato', example: 12 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: 'Nome do contrato',
    example: 'Contrato Mineração',
  })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Número do contrato', example: 'CTR-001' })
  @IsString()
  numero: string;
}

class EletricistaCargoDto {
  @ApiProperty({ description: 'ID do cargo', example: 1 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: 'Nome do cargo',
    example: 'Eletricista',
  })
  @IsString()
  nome: string;
}

export class EletricistaResponseDto {
  @ApiProperty({ description: 'ID do eletricista', example: 101 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'Nome do eletricista', example: 'Joao Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ description: 'Matricula do eletricista', example: 'MAT-123' })
  @IsString()
  matricula: string;

  @ApiProperty({
    description: 'Telefone do eletricista',
    example: '+55 31 99999-9999',
  })
  @IsString()
  telefone: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'MG' })
  @IsString()
  estado: string;

  @ApiPropertyOptional({
    description: 'Data de admissão',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  admissao?: Date;

  @ApiProperty({ description: 'ID do cargo vinculado', example: 1 })
  @IsNumber()
  @IsPositive()
  cargoId: number;

  @ApiProperty({
    description: 'Resumo do cargo',
    type: EletricistaCargoDto,
  })
  @ValidateNested()
  @Type(() => EletricistaCargoDto)
  cargo: EletricistaCargoDto;

  @ApiProperty({ description: 'ID do contrato vinculado', example: 12 })
  @IsNumber()
  @IsPositive()
  contratoId: number;

  @ApiProperty({
    description: 'Resumo do contrato',
    type: EletricistaContratoDto,
  })
  @ValidateNested()
  @Type(() => EletricistaContratoDto)
  contrato: EletricistaContratoDto;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({ description: 'Usuário criador', example: 'user123' })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({ description: 'Data da última atualização' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({ description: 'Usuário da última atualização' })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({ description: 'Data de exclusão lógica' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário que realizou a exclusão lógica',
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
