/**
 * DTO para resposta de modelo APR individual
 *
 * Define a estrutura padronizada das respostas
 * que contêm dados de um modelo APR específico.
 *
 * INCLUI:
 * - Dados básicos do modelo
 * - Informações de auditoria
 * - Timestamps formatados
 * - Relacionamentos (se solicitados)
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
 * DTO para resposta de modelo APR individual
 *
 * Define a estrutura padronizada das respostas
 * que contêm dados de um modelo APR específico.
 *
 * INCLUI:
 * - Dados básicos do modelo
 * - Informações de auditoria
 * - Timestamps formatados
 * - Relacionamentos (se solicitados)
 */
export class AprResponseDto {
  /**
   * ID único do modelo APR
   */
  @ApiProperty({
    description: 'ID único do modelo APR',
    example: 1,
  })
  @IsNumber({}, { message: 'ID deve ser um número' })
  @IsPositive({ message: 'ID deve ser positivo' })
  id: number;

  /**
   * Nome do modelo APR
   */
  @ApiProperty({
    description: 'Nome do modelo APR',
    example: 'APR Soldagem Industrial',
  })
  @IsString()
  nome: string;

  /**
   * Data de criação do modelo
   */
  @ApiProperty({
    description: 'Data de criação do modelo',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  /**
   * Usuário que criou o modelo
   */
  @ApiProperty({
    description: 'Usuário que criou o modelo',
    example: 'user123',
  })
  @IsString()
  createdBy: string;

  /**
   * Data da última atualização (opcional)
   */
  @ApiPropertyOptional({
    description: 'Data da última atualização',
    example: '2024-01-16T14:45:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;

  /**
   * Usuário que fez a última atualização (opcional)
   */
  @ApiPropertyOptional({
    description: 'Usuário que fez a última atualização',
    example: 'user456',
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  /**
   * Data de exclusão lógica (opcional)
   */
  @ApiPropertyOptional({
    description: 'Data de exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deletedAt?: Date;

  /**
   * Usuário que fez a exclusão lógica (opcional)
   */
  @ApiPropertyOptional({
    description: 'Usuário que fez a exclusão lógica',
    example: null,
  })
  @IsOptional()
  @IsString()
  deletedBy?: string;
}
