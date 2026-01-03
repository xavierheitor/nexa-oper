/**
 * DTO para sincronização de turnos
 *
 * Este DTO define a estrutura de dados retornada
 * para sincronização de turnos com clientes mobile.
 * Inclui todos os campos de auditoria para controle de versão.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para eletricista na sincronização
 */
export class EletricistaTurnoSyncDto {
  /**
   * ID do eletricista
   */
  @ApiProperty({ description: 'ID do eletricista', example: 1 })
  id: number;

  /**
   * Nome do eletricista
   */
  @ApiProperty({ description: 'Nome do eletricista', example: 'João Silva' })
  nome: string;

  /**
   * Matrícula do eletricista
   */
  @ApiProperty({ description: 'Matrícula do eletricista', example: '12345' })
  matricula: string;

  /**
   * Data de criação
   */
  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T08:00:00.000Z',
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
    example: '2024-01-01T17:00:00.000Z',
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

/**
 * DTO para sincronização de turnos
 */
export class TurnoSyncDto {
  /**
   * ID do turno
   */
  @ApiProperty({ description: 'ID do turno', example: 1 })
  id: number;

  /**
   * Data de solicitação
   */
  @ApiProperty({
    description: 'Data de solicitação',
    example: '2024-01-01T07:30:00.000Z',
  })
  dataSolicitacao: Date;

  /**
   * Data de início
   */
  @ApiProperty({
    description: 'Data de início',
    example: '2024-01-01T08:00:00.000Z',
  })
  dataInicio: Date;

  /**
   * Data de fim
   */
  @ApiProperty({
    description: 'Data de fim',
    example: '2024-01-01T17:00:00.000Z',
    nullable: true,
  })
  dataFim: Date | null;

  /**
   * ID do veículo
   */
  @ApiProperty({ description: 'ID do veículo', example: 1 })
  veiculoId: number;

  /**
   * Placa do veículo
   */
  @ApiProperty({ description: 'Placa do veículo', example: 'ABC1234' })
  veiculoPlaca: string;

  /**
   * Modelo do veículo
   */
  @ApiProperty({ description: 'Modelo do veículo', example: 'Ford Transit' })
  veiculoModelo: string;

  /**
   * ID da equipe
   */
  @ApiProperty({ description: 'ID da equipe', example: 1 })
  equipeId: number;

  /**
   * Nome da equipe
   */
  @ApiProperty({ description: 'Nome da equipe', example: 'Equipe A' })
  equipeNome: string;

  /**
   * Dispositivo
   */
  @ApiProperty({ description: 'Dispositivo', example: 'SM-G973F-001' })
  dispositivo: string;

  /**
   * KM de início
   */
  @ApiProperty({ description: 'KM de início', example: 50000 })
  kmInicio: number;

  /**
   * KM de fim
   */
  @ApiProperty({ description: 'KM de fim', example: 50120, nullable: true })
  kmFim: number | null;

  /**
   * Status do turno
   */
  @ApiProperty({ description: 'Status do turno', example: 'ABERTO' })
  status: string;

  /**
   * Eletricistas do turno
   */
  @ApiProperty({
    description: 'Eletricistas do turno',
    type: [EletricistaTurnoSyncDto],
  })
  eletricistas: EletricistaTurnoSyncDto[];

  /**
   * Data de criação
   */
  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T08:00:00.000Z',
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
    example: '2024-01-01T17:00:00.000Z',
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
