/**
 * DTO para resposta de equipe
 *
 * Este DTO define a estrutura de dados retornada
 * quando uma equipe é consultada no sistema.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para informações básicas do tipo de equipe
 */
export class TipoEquipeInfoDto {
  /**
   * ID do tipo de equipe
   */
  @ApiProperty({ description: 'ID do tipo de equipe', example: 1 })
  id: number;

  /**
   * Nome do tipo de equipe
   */
  @ApiProperty({
    description: 'Nome do tipo de equipe',
    example: 'Operacional',
  })
  nome: string;
}

/**
 * DTO para informações básicas do contrato
 */
export class ContratoInfoDto {
  /**
   * ID do contrato
   */
  @ApiProperty({ description: 'ID do contrato', example: 1 })
  id: number;

  /**
   * Nome do contrato
   */
  @ApiProperty({ description: 'Nome do contrato', example: 'Contrato ABC' })
  nome: string;

  /**
   * Número do contrato
   */
  @ApiProperty({ description: 'Número do contrato', example: 'CT-2024-001' })
  numero: string;
}

/**
 * DTO para resposta de equipe
 */
export class EquipeResponseDto {
  /**
   * ID da equipe
   */
  @ApiProperty({ description: 'ID da equipe', example: 1 })
  id: number;

  /**
   * Nome da equipe
   */
  @ApiProperty({ description: 'Nome da equipe', example: 'Equipe Alpha' })
  nome: string;

  /**
   * ID do tipo de equipe
   */
  @ApiProperty({ description: 'ID do tipo de equipe', example: 1 })
  tipoEquipeId: number;

  /**
   * Informações do tipo de equipe
   */
  @ApiProperty({
    description: 'Informações do tipo de equipe',
    type: TipoEquipeInfoDto,
  })
  tipoEquipe: TipoEquipeInfoDto;

  /**
   * ID do contrato
   */
  @ApiProperty({ description: 'ID do contrato', example: 1 })
  contratoId: number;

  /**
   * Informações do contrato
   */
  @ApiProperty({
    description: 'Informações do contrato',
    type: ContratoInfoDto,
  })
  contrato: ContratoInfoDto;

  /**
   * Data de criação
   */
  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Usuário que criou
   */
  @ApiProperty({ description: 'Usuário que criou', example: 'user123' })
  createdBy: string;

  /**
   * Data de atualização
   */
  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * Usuário que atualizou
   */
  @ApiProperty({ description: 'Usuário que atualizou', example: 'user123' })
  updatedBy: string;

  /**
   * Data de exclusão (soft delete)
   */
  @ApiProperty({
    description: 'Data de exclusão',
    example: null,
    nullable: true,
  })
  deletedAt: Date | null;

  /**
   * Usuário que excluiu
   */
  @ApiProperty({
    description: 'Usuário que excluiu',
    example: null,
    nullable: true,
  })
  deletedBy: string | null;
}
