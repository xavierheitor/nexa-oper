/**
 * DTO responsável por expor todos os detalhes de uma escala, incluindo as
 * informações do contrato e os horários configurados.
 */

import { ApiProperty } from '@nestjs/swagger';
import { EscalaVeiculoTipo } from '@nexa-oper/db';
import { EscalaHorarioResponseDto } from './escala-horario-response.dto';

class EscalaContratoResponseDto {
  @ApiProperty({ description: 'Identificador do contrato', example: 5 })
  id: number;

  @ApiProperty({ description: 'Nome do contrato', example: 'Contrato Juiz de Fora' })
  nome: string;

  @ApiProperty({ description: 'Número/código do contrato', example: 'CTR-001' })
  numero: string;
}

export class EscalaResponseDto {
  @ApiProperty({ description: 'Identificador da escala', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome da escala', example: 'Escala Espanhola' })
  nome: string;

  @ApiProperty({ description: 'Descrição da escala', nullable: true })
  descricao: string | null;

  @ApiProperty({ description: 'Código opcional para integrações', nullable: true })
  codigo: string | null;

  @ApiProperty({ description: 'Contrato vinculado' })
  contrato: EscalaContratoResponseDto;

  @ApiProperty({ description: 'Tipo de veículo recomendado', enum: EscalaVeiculoTipo, nullable: true })
  tipoVeiculo: EscalaVeiculoTipo | null;

  @ApiProperty({ description: 'Quantidade de dias que compõem o ciclo', example: 14 })
  diasCiclo: number;

  @ApiProperty({ description: 'Mínimo de eletricistas exigidos para abrir turno', example: 2 })
  minimoEletricistas: number;

  @ApiProperty({ description: 'Máximo de eletricistas permitido', nullable: true, example: 7 })
  maximoEletricistas: number | null;

  @ApiProperty({ description: 'Data que marca o início do ciclo', example: '2024-01-01T00:00:00.000Z' })
  inicioCiclo: Date;

  @ApiProperty({ description: 'Indica se a escala está ativa', example: true })
  ativo: boolean;

  @ApiProperty({
    description: 'Horários configurados para o ciclo',
    type: [EscalaHorarioResponseDto],
  })
  horarios: EscalaHorarioResponseDto[];

  @ApiProperty({ description: 'Data de criação', example: '2024-01-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Usuário que criou o registro', example: 'system' })
  createdBy: string;

  @ApiProperty({ description: 'Data da última atualização', nullable: true })
  updatedAt: Date | null;

  @ApiProperty({ description: 'Usuário que realizou a última atualização', nullable: true })
  updatedBy: string | null;
}
