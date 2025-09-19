/**
 * DTO para sincronização da relação Checklist -> Opções de Resposta
 *
 * Define a estrutura de dados para sincronização
 * da relação entre checklists e suas opções de resposta.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO para sincronização da relação Checklist -> Opções de Resposta
 */
export class ChecklistOpcaoRespostaRelacaoSyncDto {
  @ApiProperty({
    description: 'ID da relação entre checklist e opção de resposta',
    example: 12,
  })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'ID do checklist', example: 5 })
  @IsNumber()
  @IsPositive()
  checklistId: number;

  @ApiProperty({
    description: 'ID da opção de resposta vinculada',
    example: 7,
  })
  @IsNumber()
  @IsPositive()
  checklistOpcaoRespostaId: number;

  @ApiProperty({
    description: 'Data de criação da relação',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário responsável pela criação da relação',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-01-20T09:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Data da exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Usuário responsável pela exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
