/**
 * DTOs para Escalas
 *
 * Define os tipos de dados de transferência (DTOs) para operações de escala.
 */

import { EstadoSlot } from '@nexa-oper/db';

/**
 * DTO para Slot de Escala (lista simplificada)
 */
export interface SlotDTO {
  id: number;
  dataISO: string;
  estado: EstadoSlot;
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
  inicioPrevisto?: string | null;
  fimPrevisto?: string | null;
  anotacoesDia?: string | null;
}

/**
 * DTO para Resumo Diário
 */
export interface DiaResumoDTO {
  dataISO: string;
  trabalho: number;
  folga: number;
  falta: number;
  excecao: number;
  esperadoTrabalho: number;
  valido: boolean;
}

/**
 * DTO para Resultado de Publicação
 */
export interface PublicacaoResultDTO {
  periodoId: number;
  status: 'PUBLICADA';
  versao: number;
  dataPublicacao: Date;
}

/**
 * DTO para EventoCobertura (resumido)
 */
export interface EventoCoberturaDTO {
  id: number;
  tipo: 'FALTA' | 'TROCA' | 'SUPRIMENTO';
  resultado: 'COBERTO' | 'VAGA_DESCOBERTA';
  eletricistaCobrindo?: {
    id: number;
    nome: string;
  };
  justificativa?: string | null;
  registradoEm: Date;
}

/**
 * DTO para Slot com Coberturas
 */
export interface SlotComCoberturaDTO extends SlotDTO {
  coberturas: EventoCoberturaDTO[];
}

/**
 * DTO para Calendário de Escala
 */
export interface CalendarioEscalaDTO {
  periodoId: number;
  periodoInicio: Date;
  periodoFim: Date;
  status: string;
  tipoEscala: {
    id: number;
    nome: string;
    eletricistasPorTurma: number | null;
  };
  equipe: {
    id: number;
    nome: string;
  };
  dias: DiaResumoDTO[];
  slots: SlotComCoberturaDTO[];
}

/**
 * DTO para Validação de Composição
 */
export interface ValidacaoComposicaoDTO {
  valido: boolean;
  diasComProblema: Array<{
    data: string;
    esperado: number;
    encontrado: number;
  }>;
  mensagem?: string;
}

