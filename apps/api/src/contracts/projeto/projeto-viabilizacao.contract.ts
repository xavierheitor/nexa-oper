export type ProjetoViabilizacaoStatusContract =
  | 'PENDENTE'
  | 'EM_VIABILIZACAO'
  | 'VIABILIZADO_PARCIAL';

export type ProjetoTipoViabilizacaoPendenteContract = 'TOTAL' | 'PARCIAL';

export interface ProjetoContratoResumoContract {
  id: number;
  nome: string;
  numero: string;
}

export interface ProjetoUltimaViabilizacaoContract {
  id: number;
  resultado: 'PARCIAL' | 'TOTAL';
  dataViabilizacao: Date | null;
  enviadaEm: Date | null;
  observacao: string | null;
}

export interface ProjetoParaViabilizacaoContract {
  id: number;
  contrato: ProjetoContratoResumoContract;
  numeroProjeto: string;
  descricao: string;
  equipamento: string;
  municipio: string;
  observacao: string | null;
  status: ProjetoViabilizacaoStatusContract;
  tipoViabilizacaoPendente: ProjetoTipoViabilizacaoPendenteContract;
  ultimaViabilizacao: ProjetoUltimaViabilizacaoContract | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ListProjetosParaViabilizacaoInputContract {
  contractIds: number[];
}

export interface ListProjetosParaViabilizacaoResponseContract {
  items: ProjetoParaViabilizacaoContract[];
  total: number;
}
