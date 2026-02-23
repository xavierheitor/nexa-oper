export interface AbrirTurnoEletricistaContract {
  eletricistaId: number;
  motorista?: boolean;
}

export interface AbrirTurnoChecklistRespostaContract {
  perguntaId: number;
  opcaoRespostaId: number;
}

export interface AbrirTurnoChecklistItemContract {
  uuid: string;
  checklistId: number;
  eletricistaId: number;
  latitude?: number;
  longitude?: number;
  respostas: AbrirTurnoChecklistRespostaContract[];
}

/**
 * Contrato externo de entrada para abertura de turno.
 */
export interface AbrirTurnoRequestContract {
  veiculoId: number;
  equipeId: number;
  dispositivo?: string;
  versaoApp?: string;
  kmInicio: number;
  dataInicio?: Date;
  eletricistas: AbrirTurnoEletricistaContract[];
  checklists?: AbrirTurnoChecklistItemContract[];
}

export interface TurnoCardContract {
  id: number;
  dataInicio: Date;
  dataFim: Date | null;
  status: 'ABERTO' | 'FECHADO';
  kmInicio: number;
  kmFim: number | null;
  veiculo: { id: number; nome: string };
  equipe: { id: number; nome: string };
}

/**
 * Contrato externo de saída para POST /turno/abrir (campo data do envelope).
 */
export interface AbrirTurnoResponseContract extends TurnoCardContract {
  remoteId: number;
  dispositivo?: string;
  versaoApp?: string;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  eletricistas: { eletricistaId: number; motorista: boolean }[];
  checklists: unknown[];
  turnosRealizados: unknown[];
  checklistsSalvos: number;
  respostasAguardandoFoto?: number[];
  processamentoAssincrono?: string;
}
