/**
 * DTOs que representam a agenda calculada de uma escala em determinado
 * intervalo de datas. Esses objetos são consumidos pelo aplicativo mobile para
 * orientar a abertura de turnos e pelo backoffice para planejamento.
 */

import { ApiProperty } from '@nestjs/swagger';
import { EscalaVeiculoTipo } from '@nexa-oper/db';
import { EscalaHorarioResponseDto } from './escala-horario-response.dto';

export class EscalaAgendaEletricistaDto {
  @ApiProperty({ description: 'ID do eletricista', example: 12 })
  id: number;

  @ApiProperty({ description: 'Nome do eletricista', example: 'Maria Souza' })
  nome: string;

  @ApiProperty({ description: 'Matrícula do eletricista', example: 'MAT-002' })
  matricula: string;

  @ApiProperty({ description: 'Posição na rotação', example: 1 })
  ordemRotacao: number;

  @ApiProperty({ description: 'Indica se o eletricista está escalado para o dia', example: true })
  escalado: boolean;
}

export class EscalaAgendaSlotDto {
  @ApiProperty({ description: 'Dados do horário configurado' })
  horario: EscalaHorarioResponseDto;

  @ApiProperty({
    description: 'Lista de eletricistas analisados para este horário',
    type: [EscalaAgendaEletricistaDto],
  })
  eletricistas: EscalaAgendaEletricistaDto[];
}

export class EscalaAgendaDiaDto {
  @ApiProperty({ description: 'Data do dia (UTC)', example: '2024-01-01T00:00:00.000Z' })
  data: Date;

  @ApiProperty({ description: 'Índice do ciclo correspondente', example: 3 })
  indiceCiclo: number;

  @ApiProperty({ description: 'Lista de slots/horários do dia', type: [EscalaAgendaSlotDto] })
  slots: EscalaAgendaSlotDto[];
}

class EscalaAgendaResumoDto {
  @ApiProperty({ description: 'ID da escala', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome da escala', example: 'Escala Espanhola' })
  nome: string;

  @ApiProperty({ description: 'Tipo de veículo recomendado', enum: EscalaVeiculoTipo, nullable: true })
  tipoVeiculo: EscalaVeiculoTipo | null;

  @ApiProperty({ description: 'Dias que compõem o ciclo', example: 14 })
  diasCiclo: number;

  @ApiProperty({ description: 'Início do ciclo utilizado nos cálculos' })
  inicioCiclo: Date;
}

export class EscalaAgendaResponseDto {
  @ApiProperty({ description: 'Resumo da escala utilizada' })
  escala: EscalaAgendaResumoDto;

  @ApiProperty({ description: 'Data inicial considerada', example: '2024-01-01T00:00:00.000Z' })
  dataInicio: Date;

  @ApiProperty({ description: 'Data final considerada', example: '2024-01-15T00:00:00.000Z' })
  dataFim: Date;

  @ApiProperty({ description: 'Dias do período', type: [EscalaAgendaDiaDto] })
  dias: EscalaAgendaDiaDto[];
}
