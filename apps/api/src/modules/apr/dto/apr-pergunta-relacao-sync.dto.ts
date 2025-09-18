/**
 * DTO para sincronização da relação APR -> Perguntas
 *
 * Define a estrutura de dados para sincronização
 * da relação entre modelos APR e suas perguntas.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

/**
 * DTO para sincronização da relação APR -> Perguntas
 */
export class AprPerguntaRelacaoSyncDto {
  @ApiProperty({
    description: 'ID da relação entre APR e pergunta',
    example: 10,
  })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'ID do modelo APR', example: 5 })
  @IsNumber()
  @IsPositive()
  aprId: number;

  @ApiProperty({ description: 'ID da pergunta APR vinculada', example: 2 })
  @IsNumber()
  @IsPositive()
  aprPerguntaId: number;

  @ApiProperty({ description: 'Ordem da pergunta dentro da APR', example: 1 })
  @IsNumber()
  @IsInt()
  ordem: number;

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
