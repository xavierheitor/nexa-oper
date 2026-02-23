export interface AtividadeUploadPhotoContract {
  ref?: string;
  base64: string;
  mimeType?: string;
  fileName?: string;
  capturedAt?: string;
  contexto?: string;
}

export interface AtividadeUploadMedidorContract {
  somenteRetirada?: boolean;
  instaladoNumero?: string | null;
  instaladoPhotoId?: number | null;
  instaladoPhotoRef?: string | null;
  instaladoFoto?: AtividadeUploadPhotoContract | null;
  retiradoStatus?: string | null;
  retiradoNumero?: string | null;
  retiradoLeitura?: string | null;
  retiradoPhotoId?: number | null;
  retiradoPhotoRef?: string | null;
  retiradoFoto?: AtividadeUploadPhotoContract | null;
}

export interface AtividadeUploadMaterialContract {
  materialCatalogoRemoteId?: number | null;
  materialCodigo: string;
  materialDescricao: string;
  unidadeMedida: string;
  quantidade: number;
}

export interface AtividadeUploadRespostaContract {
  perguntaRemoteId?: number | null;
  perguntaChave: string;
  perguntaTituloSnapshot: string;
  ordem?: number;
  respostaTexto?: string | null;
  obrigaFotoSnapshot?: boolean;
  fotoId?: number | null;
  fotoRef?: string | null;
  foto?: AtividadeUploadPhotoContract | null;
  dataResposta?: string;
}

export interface AtividadeUploadEventoContract {
  tipoEvento: string;
  locationTrackId?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  detalhe?: string | null;
  capturadoEm?: string;
}

export interface AtividadeUploadRequestContract {
  atividadeUuid: string;
  atividadeRemoteId?: number | null;
  turnoId: number;
  tipoAtividadeRemoteId?: number | null;
  tipoAtividadeNome?: string | null;
  tipoServicoRemoteId?: number | null;
  tipoServicoNome?: string | null;
  atividadeFormTemplateId?: number | null;
  tipoLigacao?: string | null;
  numeroDocumento?: string | null;
  aplicaMedidor?: boolean;
  aplicaRamal?: boolean;
  aplicaMaterial?: boolean;
  statusFluxo?: string;
  etapaAtual?: string;
  aprPreenchidaEm?: string;
  finalizadaEm?: string;
  observacoesFinalizacao?: string | null;
  dataCriacao?: string;
  dataModificacao?: string;
  medidor?: AtividadeUploadMedidorContract | null;
  materiais?: AtividadeUploadMaterialContract[];
  respostas?: AtividadeUploadRespostaContract[];
  eventos?: AtividadeUploadEventoContract[];
  fotos?: AtividadeUploadPhotoContract[];
}

export interface AtividadeUploadResponseContract {
  status: 'ok';
  atividadeExecucaoId: number;
  atividadeUuid: string;
  alreadyExisted: boolean;
  savedPhotos: number;
}
