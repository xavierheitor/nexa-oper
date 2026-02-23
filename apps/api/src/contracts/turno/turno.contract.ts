export type TurnoStatusContract = 'ABERTO' | 'FECHADO';

export interface TurnoSummaryContract {
  id: number;
  dataInicio: Date;
  dataFim: Date | null;
  status: TurnoStatusContract;
  kmInicio: number;
  kmFim: number | null;
  veiculo: { id: number; nome: string };
  equipe: { id: number; nome: string };
}

export interface TurnoDetalheContract extends TurnoSummaryContract {
  dispositivo?: string;
  versaoApp?: string;
  createdAt: Date;
  updatedAt: Date | null;
  createdBy: string;
  updatedBy: string | null;
  eletricistas: { eletricistaId: number; motorista: boolean }[];
  checklists: unknown[];
  turnosRealizados: unknown[];
}

export interface ListTurnosMetaContract {
  total: number;
  page: number;
  limit: number;
}

export interface ListTurnosResponseContract {
  items: TurnoSummaryContract[];
  meta: ListTurnosMetaContract;
}

export interface FecharTurnoRequestContract {
  turnoId?: number;
  kmFim?: number;
  dataFim?: Date;
  kmFinal?: number;
  horaFim?: Date;
  latitude?: string;
  longitude?: string;
}

export interface TurnoQueryContract {
  page?: number;
  limit?: number;
  veiculoId?: number;
  equipeId?: number;
  eletricistaId?: number;
  status?: TurnoStatusContract;
  dataInicioFrom?: Date;
  dataInicioTo?: Date;
  search?: string;
}

export interface SyncTurnosInputContract {
  since?: Date;
  limit?: number;
}
