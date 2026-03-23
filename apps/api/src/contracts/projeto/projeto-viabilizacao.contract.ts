export type ProjetoViabilizacaoStatusContract =
  | 'PENDENTE'
  | 'EM_VIABILIZACAO'
  | 'EM_CORRECAO'
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

export interface ProjetoUltimaValidacaoViabilizacaoContract {
  id: number;
  resultado: 'APROVADA' | 'CORRIGIDA' | 'REJEITADA';
  validadaEm: Date;
  observacao: string | null;
}

export interface ProjetoEscopoPosteCadastroContract {
  id: number;
  identificador: string;
  numeroPoste: string;
}

export interface ProjetoEscopoPosteEstruturaContract {
  id: number;
  tipoEstruturaId: number;
}

export interface ProjetoEscopoPosteRamalContract {
  id: number;
  tipoRamalId: number;
  quantidadePrevista: number;
}

export interface ProjetoEscopoPosteContract {
  id: number;
  cadastroPoste: ProjetoEscopoPosteCadastroContract;
  viabilizacaoId: number | null;
  validacaoId: number | null;
  tipoPosteId: number | null;
  latitude: string | null;
  longitude: string | null;
  ordem: number | null;
  observacao: string | null;
  estruturas: ProjetoEscopoPosteEstruturaContract[];
  ramaisPrevistos: ProjetoEscopoPosteRamalContract[];
}

export interface ProjetoEscopoVaoContract {
  id: number;
  viabilizacaoId: number | null;
  validacaoId: number | null;
  posteOrigemId: number;
  posteDestinoId: number;
  materialCondutorId: number;
  observacao: string | null;
}

export interface ProjetoEscopoAtualContract {
  postes: ProjetoEscopoPosteContract[];
  vaos: ProjetoEscopoVaoContract[];
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
