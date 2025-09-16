/**
 * DTOs (Data Transfer Objects) para APR
 *
 * Este arquivo define todos os DTOs utilizados nas operações
 * relacionadas aos modelos de APR (Análise Preliminar de Risco).
 *
 * FUNCIONALIDADES:
 * - Validação automática de dados de entrada
 * - Documentação Swagger automática
 * - Tipagem TypeScript rigorosa
 * - Transformação de dados padronizada
 * - Serialização consistente de respostas
 *
 * TIPOS DE DTOs:
 * - CreateAprDto: Para criação de novos modelos
 * - UpdateAprDto: Para atualização de modelos existentes
 * - AprResponseDto: Para respostas de modelos individuais
 * - AprListResponseDto: Para respostas de listas paginadas
 *
 * PADRÕES IMPLEMENTADOS:
 * - Class-validator para validações
 * - Class-transformer para transformações
 * - ApiProperty para documentação Swagger
 * - Partial types para operações opcionais
 * - Interfaces bem definidas
 *
 * @example
 * ```typescript
 * // Criar novo modelo APR
 * const createDto: CreateAprDto = {
 *   nome: "APR Soldagem Industrial"
 * };
 *
 * // Atualizar modelo existente
 * const updateDto: UpdateAprDto = {
 *   nome: "APR Soldagem Industrial Atualizada"
 * };
 * ```
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * DTO para criação de novo modelo APR
 *
 * Define e valida os dados necessários para criar
 * um novo modelo de Análise Preliminar de Risco.
 *
 * VALIDAÇÕES:
 * - Nome obrigatório entre 1 e 255 caracteres
 * - Trimming automático de espaços
 * - Documentação Swagger automática
 */
export class CreateAprDto {
  /**
   * Nome do modelo APR
   *
   * Deve ser único e descritivo para identificar
   * claramente o propósito da análise de risco.
   */
  @ApiProperty({
    description: 'Nome do modelo APR',
    example: 'APR Soldagem Industrial',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @MinLength(1, { message: 'Nome deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  nome: string;
}

/**
 * DTO para atualização de modelo APR existente
 *
 * Estende CreateAprDto tornando todos os campos opcionais
 * para permitir atualizações parciais.
 *
 * COMPORTAMENTO:
 * - Todos os campos são opcionais
 * - Mantém as mesmas validações quando fornecidos
 * - Permite atualizações incrementais
 */
export class UpdateAprDto extends PartialType(CreateAprDto) {
  /**
   * Nome do modelo APR (opcional para atualização)
   */
  @ApiPropertyOptional({
    description: 'Nome do modelo APR',
    example: 'APR Soldagem Industrial Atualizada',
    minLength: 1,
    maxLength: 255,
  })
  nome?: string;
}

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

/**
 * DTO para metadados de paginação
 *
 * Define informações sobre paginação utilizadas
 * em respostas de listas paginadas.
 */
export class PaginationMetaDto {
  /**
   * Número total de itens
   */
  @ApiProperty({
    description: 'Número total de itens',
    example: 150,
  })
  @IsNumber()
  @IsInt()
  total: number;

  /**
   * Página atual
   */
  @ApiProperty({
    description: 'Página atual',
    example: 1,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  page: number;

  /**
   * Itens por página
   */
  @ApiProperty({
    description: 'Itens por página',
    example: 10,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  limit: number;

  /**
   * Total de páginas
   */
  @ApiProperty({
    description: 'Total de páginas',
    example: 15,
  })
  @IsNumber()
  @IsInt()
  @IsPositive()
  totalPages: number;

  /**
   * Indica se há página anterior
   */
  @ApiProperty({
    description: 'Indica se há página anterior',
    example: false,
  })
  hasPrevious: boolean;

  /**
   * Indica se há próxima página
   */
  @ApiProperty({
    description: 'Indica se há próxima página',
    example: true,
  })
  hasNext: boolean;
}

/**
 * DTO para resposta de lista paginada de modelos APR
 *
 * Define a estrutura padronizada das respostas
 * que contêm listas paginadas de modelos APR.
 *
 * INCLUI:
 * - Array de modelos APR
 * - Metadados de paginação
 * - Informações de busca
 * - Estatísticas da consulta
 */
export class AprListResponseDto {
  /**
   * Array de modelos APR (versão simplificada)
   */
  @ApiProperty({
    description: 'Lista de modelos APR',
    type: [AprResponseDto],
  })
  @IsArray()
  @Type(() => AprResponseDto)
  data: AprResponseDto[];

  /**
   * Metadados de paginação
   */
  @ApiProperty({
    description: 'Metadados de paginação',
    type: PaginationMetaDto,
  })
  @Type(() => PaginationMetaDto)
  meta: PaginationMetaDto;

  /**
   * Termo de busca utilizado (opcional)
   */
  @ApiPropertyOptional({
    description: 'Termo de busca utilizado',
    example: 'soldagem',
  })
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * Timestamp da consulta
   */
  @ApiProperty({
    description: 'Timestamp da consulta',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

/**
 * DTO para parâmetros de consulta de lista
 *
 * Define e valida os parâmetros aceitos
 * para consultas de lista paginada.
 */
export class AprQueryDto {
  /**
   * Número da página
   */
  @ApiPropertyOptional({
    description: 'Número da página',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @IsPositive({ message: 'Página deve ser positiva' })
  @Type(() => Number)
  page?: number = 1;

  /**
   * Itens por página
   */
  @ApiPropertyOptional({
    description: 'Itens por página',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite deve ser um número' })
  @IsPositive({ message: 'Limite deve ser positivo' })
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Termo de busca
   */
  @ApiPropertyOptional({
    description: 'Termo de busca por nome',
    example: 'soldagem',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(255, { message: 'Busca deve ter no máximo 255 caracteres' })
  @Transform(({ value }) => value?.trim())
  search?: string;
}
