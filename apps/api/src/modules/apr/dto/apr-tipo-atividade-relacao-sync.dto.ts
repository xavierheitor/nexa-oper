/**
 * DTO para sincronização da relação APR -> Tipo de Atividade
 *
 * Define a estrutura de dados para sincronização
 * da relação entre modelos APR e tipos de atividade.
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
 * DTO para sincronização da relação APR -> Tipo de Atividade
 */
export class AprTipoAtividadeRelacaoSyncDto {
  @ApiProperty({
    description: 'ID da relação entre APR e tipo de atividade',
    example: 20,
  })
  @IsNumber()
  @IsPositive()
  id: number;

  @ApiProperty({ description: 'ID do modelo APR', example: 6 })
  @IsNumber()
  @IsPositive()
  aprId: number;

  @ApiProperty({ description: 'ID do tipo de atividade vinculado', example: 8 })
  @IsNumber()
  @IsPositive()
  tipoAtividadeId: number;

  @ApiProperty({
    description: 'Data de criação da relação',
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
