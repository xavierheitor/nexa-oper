/**
 * DTO para sincronização de opções de resposta APR
 *
 * Define a estrutura de dados para sincronização
 * de opções de resposta de Análise Preliminar de Risco.
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
 * DTO para sincronização de opções de resposta APR
 */
export class AprOpcaoRespostaSyncDto {
  @ApiProperty({ description: 'ID único da opção de resposta', example: 3 })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({
    description: 'Descrição da opção de resposta',
    example: 'Sim',
  })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'Data de criação da opção',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Usuário responsável pela criação',
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
