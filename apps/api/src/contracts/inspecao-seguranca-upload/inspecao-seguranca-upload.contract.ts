export type InspecaoSegurancaContextoContract =
  | 'GERAL'
  | 'COLABORADOR'
  | 'EPC'
  | 'VEICULO';

export type InspecaoSegurancaEvidenciaTipoContract = 'PROBLEMA' | 'TRATAMENTO';

export interface InspecaoSegurancaUploadPhotoContract {
  ref?: string;
  base64: string;
  mimeType?: string;
  fileName?: string;
  capturedAt?: string;
  tipo?: InspecaoSegurancaEvidenciaTipoContract;
}

export interface InspecaoSegurancaUploadRespostaContract {
  respostaUuid?: string;
  grupoPerguntaId?: number | null;
  perguntaId?: number | null;
  opcaoRespostaId?: number | null;
  grupoNomeSnapshot?: string | null;
  perguntaNomeSnapshot: string;
  tipoRespostaSnapshot: string;
  opcaoRespostaNomeSnapshot?: string | null;
  respostaTexto?: string | null;
  marcado?: boolean | null;
  ordemGrupo?: number;
  ordemPergunta?: number;
  dataResposta?: string;
  geraPendenciaSnapshot?: boolean;
  exigeFotoSnapshot?: boolean;
  sanadaEmCampo?: boolean;
  observacaoProblema?: string | null;
  observacaoTratamento?: string | null;
  fotos?: InspecaoSegurancaUploadPhotoContract[];
}

export interface InspecaoSegurancaUploadRequestContract {
  inspecaoUuid: string;
  turnoId: number;
  modeloId?: number | null;
  tipoId?: number | null;
  modeloNomeSnapshot: string;
  tipoNomeSnapshot: string;
  tipoChaveSnapshot: string;
  contextoSnapshot: InspecaoSegurancaContextoContract;
  inspetorNomeSnapshot?: string | null;
  colaboradorNomeSnapshot?: string | null;
  epcNomeSnapshot?: string | null;
  placaVeiculoSnapshot?: string | null;
  veiculoId?: number | null;
  observacoes?: string | null;
  realizadaEm?: string;
  latitude?: number | null;
  longitude?: number | null;
  respostas: InspecaoSegurancaUploadRespostaContract[];
}

export interface InspecaoSegurancaUploadResponseContract {
  id: number;
  inspecaoUuid: string;
  alreadyExisted: boolean;
  respostasSalvas: number;
  pendenciasGeradas: number;
  evidenciasSalvas: number;
}
