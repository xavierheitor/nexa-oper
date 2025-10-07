/**
 * DTOs que representam as requisições de alocação de eletricistas em horários
 * específicos da escala. A rotação automática utiliza o campo ordemRotacao
 * para definir quem entra em campo a cada dia do ciclo.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EscalaAssignmentItemDto {
  @ApiProperty({ description: 'ID do horário da escala', example: 10 })
  @IsInt({ message: 'Horário deve ser um número inteiro' })
  @Min(1, { message: 'Horário inválido' })
  horarioId: number;

  @ApiProperty({ description: 'ID do eletricista', example: 22 })
  @IsInt({ message: 'Eletricista deve ser um número inteiro' })
  @Min(1, { message: 'Eletricista inválido' })
  eletricistaId: number;

  @ApiProperty({
    description: 'Posição na rotação automática',
    example: 0,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'Ordem de rotação deve ser numérica' })
  @Min(0, { message: 'Ordem de rotação deve ser positiva' })
  ordemRotacao?: number;

  @ApiProperty({ description: 'Data opcional de início da vigência', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'Data inicial deve ser válida' })
  vigenciaInicio?: string;

  @ApiProperty({ description: 'Data opcional de fim da vigência', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: 'Data final deve ser válida' })
  vigenciaFim?: string;

  @ApiProperty({ description: 'Define se a alocação deve ser marcada como ativa', default: true })
  @IsOptional()
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean;
}

export class EscalaAssignDto {
  @ApiProperty({ description: 'Lista de alocações', type: [EscalaAssignmentItemDto] })
  @IsArray({ message: 'Alocações devem ser enviadas em lista' })
  @ArrayNotEmpty({ message: 'Pelo menos uma alocação deve ser informada' })
  @ValidateNested({ each: true })
  @Type(() => EscalaAssignmentItemDto)
  alocacoes: EscalaAssignmentItemDto[];
}
