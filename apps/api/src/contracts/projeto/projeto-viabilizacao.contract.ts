export type ProjetoViabilizacaoStatusContract =
  | 'PENDENTE'
  | 'EM_VIABILIZACAO'
  | 'AGUARDANDO_VALIDACAO'
  | 'EM_CORRECAO'
  | 'VIABILIZADO_PARCIAL'
  | 'VIABILIZADO_TOTAL';

export type ProjetoTipoViabilizacaoPendenteContract = 'TOTAL' | 'PARCIAL';

export interface ProjetoContratoResumoContract {
  id: number;
  nome: string;
  numero: string;
}

export interface ProjetoProgramaResumoContract {
  id: number;
  nome: string;
}

export interface ProjetoUltimaViabilizacaoContract {
  id: number;
  data: string;
  observacao: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProjetoUltimaValidacaoViabilizacaoContract {
  id: number;
  posteId: number;
  data: Date;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProjetoEscopoPosteEstruturaContract {
  id: number;
  estruturaId: number;
}

export interface ProjetoEscopoPosteRamalContract {
  id: number;
  tipoRamalId: number;
}

export interface ProjetoEscopoPosteContract {
  id: number;
  viabilizacaoId: number;
  tipoPosteId: number;
  cadastro: string;
  uuid: string;
  latitude: string | null;
  longitude: string | null;
  estruturas: ProjetoEscopoPosteEstruturaContract[];
  ramais: ProjetoEscopoPosteRamalContract[];
  ultimaValidacao: ProjetoUltimaValidacaoViabilizacaoContract | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProjetoEscopoVaoContract {
  id: number;
  viabilizacaoId: number;
  posteInicioId: number;
  posteFimId: number;
  materialCondutorId: number;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface ProjetoEscopoAtualContract {
  viabilizacaoId: number | null;
  postes: ProjetoEscopoPosteContract[];
  vaos: ProjetoEscopoVaoContract[];
}

export interface ProjetoParaViabilizacaoContract {
  id: number;
  contrato: ProjetoContratoResumoContract;
  programa: ProjetoProgramaResumoContract;
  numeroProjeto: string;
  descricao: string;
  equipamento: string;
  municipio: string;
  status: ProjetoViabilizacaoStatusContract;
  tipoViabilizacaoPendente: ProjetoTipoViabilizacaoPendenteContract;
  ultimaViabilizacao: ProjetoUltimaViabilizacaoContract | null;
  ultimaValidacao: ProjetoUltimaValidacaoViabilizacaoContract | null;
  escopoAtual: ProjetoEscopoAtualContract;
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
