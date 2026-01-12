/**
 * Tipos TypeScript para Turnos Previstos
 *
 * Tipos relacionados ao relatório de turnos previstos baseado em escalas.
 */

/**
 * Status de um turno previsto
 */
export type StatusTurnoPrevisto =
  | 'ADERENTE'
  | 'NAO_ADERENTE'
  | 'NAO_ABERTO'
  | 'TURNO_EXTRA';

/**
 * Representa um turno previsto baseado na escala
 */
export interface TurnoPrevisto {
  equipeId: number;
  equipeNome: string;
  tipoEquipeId: number;
  tipoEquipeNome: string;
  baseNome: string | null;
  horarioPrevisto: string | null; // "HH:MM:SS" ou null
  eletricistas: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>;
  eletricistasQueAbriram?: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>; // Eletricistas que realmente abriram o turno
  status: StatusTurnoPrevisto;
  turnoId?: number; // Se abriu, ID do turno
  dataAbertura?: Date; // Se abriu, quando abriu
  diferencaMinutos?: number; // Diferença em minutos do horário previsto (se abriu)
}

/**
 * Estatísticas agregadas dos turnos previstos
 */
export interface EstatisticasTurnosPrevistos {
  totalPrevistosHoje: number;
  totalAbertos: number;
  totalNaoAbertos: number;
  totalAderentes: number;
  totalNaoAderentes: number;
  totalTurnosExtras: number; // Turnos abertos sem escala
  previstosAteAgora: number; // Previstos até a hora atual
  abertosAteAgora: number; // Abertos até a hora atual
  porTipoEquipe: Array<{
    tipoEquipeId: number;
    tipoEquipeNome: string;
    previstos: number;
    abertos: number;
    naoAbertos: number;
  }>;
}
