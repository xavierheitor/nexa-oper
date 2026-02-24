import type { PaginatedResult } from './common';

export interface TurnoEletricistaResumo {
  id: number;
  motorista?: boolean;
  eletricista?: {
    id: number;
    nome: string;
  } | null;
}

export interface TurnoResumo {
  id: number;
  dataInicio?: Date | string;
  dataFim?: Date | string | null;
  equipe?: {
    id: number;
    nome: string;
  } | null;
  veiculo?: {
    id: number;
    placa: string;
    modelo?: string | null;
  } | null;
  TurnoEletricistas?: TurnoEletricistaResumo[];
}

export interface AtividadeExecucaoListItem {
  id: number;
  atividadeUuid: string;
  turnoId: number;
  tipoAtividadeId?: number | null;
  tipoAtividadeServicoId?: number | null;
  tipoAtividadeNomeSnapshot?: string | null;
  tipoServicoNomeSnapshot?: string | null;
  numeroDocumento?: string | null;
  aplicaMedidor: boolean;
  aplicaMaterial: boolean;
  statusFluxo: string;
  etapaAtual: string;
  finalizadaEm?: Date | string | null;
  createdAt: Date | string;
  turno?: TurnoResumo | null;
  tipoAtividade?: {
    id: number;
    nome: string;
  } | null;
  tipoAtividadeServico?: {
    id: number;
    nome: string;
  } | null;
  atividadeMedidor?: {
    id: number;
  } | null;
  atividadeMateriaisAplicados?: Array<{
    id: number;
    quantidade: number;
  }>;
}

export interface AtividadeMedidorListItem {
  id: number;
  atividadeExecucaoId: number;
  somenteRetirada: boolean;
  instaladoNumero?: string | null;
  retiradoStatus?: string | null;
  retiradoNumero?: string | null;
  retiradoLeitura?: string | null;
  createdAt: Date | string;
  atividadeExecucao?: AtividadeExecucaoListItem | null;
}

export interface AtividadeMaterialListItem {
  id: number;
  atividadeExecucaoId: number;
  materialCatalogoId?: number | null;
  materialCodigoSnapshot: string;
  materialDescricaoSnapshot: string;
  unidadeMedidaSnapshot: string;
  quantidade: number;
  createdAt: Date | string;
  materialCatalogo?: {
    id: number;
    codigo: string;
    descricao: string;
  } | null;
  atividadeExecucao?: AtividadeExecucaoListItem | null;
}

export interface TipoAtividadeFiltroOption {
  id: number;
  nome: string;
}

export interface TipoAtividadeServicoFiltroOption {
  id: number;
  nome: string;
  atividadeTipoId: number;
  atividadeTipo?: {
    id: number;
    nome: string;
  } | null;
}

export interface EquipeFiltroOption {
  id: number;
  nome: string;
}

export interface VeiculoFiltroOption {
  id: number;
  placa: string;
  modelo?: string | null;
}

export interface EletricistaFiltroOption {
  id: number;
  nome: string;
  matricula?: string | null;
}

export interface TurnoFiltroOption extends TurnoResumo {}

export interface AtividadesFilterFieldMap {
  tipoAtividadeId?: number;
  tipoAtividadeServicoId?: number;
  turnoId?: number;
  equipeId?: number;
  veiculoId?: number;
  eletricistaId?: number;
  turnoDia?: Date;
}

export type AtividadeExecucaoPaginated = PaginatedResult<AtividadeExecucaoListItem>;
export type AtividadeMedidorPaginated = PaginatedResult<AtividadeMedidorListItem>;
export type AtividadeMaterialPaginated = PaginatedResult<AtividadeMaterialListItem>;
