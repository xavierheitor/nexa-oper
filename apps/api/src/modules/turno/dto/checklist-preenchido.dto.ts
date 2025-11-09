/**
 * DTOs para checklists preenchidos
 *
 * Este arquivo define os DTOs para validação e transferência de dados
 * relacionados aos checklists preenchidos pelos eletricistas.
 */

import { IsNotEmpty, IsInt, IsString, IsDateString, IsArray, IsOptional, IsNumber, ValidateNested, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ChecklistRespostaDto } from './checklist-resposta.dto';

/**
 * DTO para salvar um checklist preenchido
 */
export class SalvarChecklistPreenchidoDto {
  @ApiProperty({
    description: 'UUID único do checklist preenchido (gerado pelo app mobile)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  uuid!: string;

  @ApiProperty({
    description: 'ID do modelo/template do checklist',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  checklistId: number;

  @ApiProperty({
    description: 'ID do eletricista que preencheu',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  eletricistaId: number;

  @ApiProperty({
    description: 'Data e hora do preenchimento',
    example: '2025-10-22T20:10:27.000Z',
  })
  @IsNotEmpty()
  @IsDateString()
  dataPreenchimento: string;

  @ApiProperty({
    description: 'Latitude do local do preenchimento',
    example: -23.5505,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    description: 'Longitude do local do preenchimento',
    example: -46.6333,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    description: 'Lista de respostas do checklist',
    type: [ChecklistRespostaDto],
  })
  @IsNotEmpty({ message: 'Lista de respostas é obrigatória' })
  @IsArray({ message: 'Respostas deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Pelo menos uma resposta é obrigatória' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistRespostaDto)
  respostas: ChecklistRespostaDto[];
}

/**
 * DTO para resposta de checklist preenchido
 */
export class ChecklistPreenchidoResponseDto {
  @ApiProperty({ description: 'ID do checklist preenchido' })
  id: number;

  @ApiProperty({ description: 'ID do turno' })
  turnoId: number;

  @ApiProperty({ description: 'ID do modelo do checklist' })
  checklistId: number;

  @ApiProperty({ description: 'Nome do checklist' })
  checklistNome?: string;

  @ApiProperty({ description: 'ID do eletricista' })
  eletricistaId: number;

  @ApiProperty({ description: 'Nome do eletricista' })
  eletricistaNome?: string;

  @ApiProperty({ description: 'Data do preenchimento' })
  dataPreenchimento: Date;

  @ApiProperty({ description: 'Latitude' })
  latitude?: number;

  @ApiProperty({ description: 'Longitude' })
  longitude?: number;

  @ApiProperty({ description: 'Lista de respostas' })
  respostas?: any[];

  @ApiProperty({ description: 'Quantidade de pendências geradas' })
  pendenciasGeradas?: number;

  @ApiProperty({ description: 'Quantidade de respostas aguardando foto' })
  respostasAguardandoFoto?: number;
}

/**
 * DTO para salvar múltiplos checklists de um turno
 */
export class SalvarChecklistsDoTurnoDto {
  @ApiProperty({
    description: 'ID do turno',
    example: 16
  })
  @IsNotEmpty()
  @IsInt()
  turnoId: number;

  @ApiProperty({
    description: 'Lista de checklists preenchidos',
    type: [SalvarChecklistPreenchidoDto]
  })
  @IsNotEmpty({ message: 'Lista de checklists é obrigatória' })
  @IsArray({ message: 'Checklists deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Pelo menos um checklist é obrigatório' })
  @ValidateNested({ each: true })
  @Type(() => SalvarChecklistPreenchidoDto)
  checklists: SalvarChecklistPreenchidoDto[];
}
