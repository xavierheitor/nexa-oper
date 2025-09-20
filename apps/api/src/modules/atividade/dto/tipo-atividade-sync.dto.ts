/**
 * DTO para sincronização de tipos de atividade
 *
 * Este DTO define a estrutura de dados retornada
 * para sincronização de tipos de atividade com clientes mobile.
 * Inclui todos os campos de auditoria para controle de versão.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para sincronização de tipos de atividade
 */
export class TipoAtividadeSyncDto {
  /**
   * ID do tipo de atividade
   */
  @ApiProperty({ description: 'ID do tipo de atividade', example: 1 })
  id: number;

  /**
   * Nome do tipo de atividade
   */
  @ApiProperty({ description: 'Nome do tipo de atividade', example: 'Soldagem' })
  nome: string;

  /**
   * Data de criação
   */
  @ApiProperty({ description: 'Data de criação', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  /**
   * Usuário que criou
   */
  @ApiProperty({ description: 'Usuário que criou', example: 'user123' })
  createdBy: string;

  /**
   * Data de atualização
   */
  @ApiProperty({ description: 'Data de atualização', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;

  /**
   * Usuário que atualizou
   */
  @ApiProperty({ description: 'Usuário que atualizou', example: 'user123' })
  updatedBy: string;

  /**
   * Data de exclusão (soft delete)
   */
  @ApiProperty({ description: 'Data de exclusão', example: null, nullable: true })
  deletedAt: Date | null;

  /**
   * Usuário que excluiu
   */
  @ApiProperty({ description: 'Usuário que excluiu', example: null, nullable: true })
  deletedBy: string | null;
}
