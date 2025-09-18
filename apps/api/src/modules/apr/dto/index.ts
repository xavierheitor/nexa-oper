/**
 * Arquivo de índice para exportação de todos os DTOs do módulo APR
 *
 * Este arquivo centraliza todas as exportações dos DTOs relacionados
 * à Análise Preliminar de Risco (APR) para facilitar a importação
 * em outros módulos e arquivos.
 *
 * DTOs disponíveis:
 * - CreateAprDto: Para criação de novos modelos
 * - UpdateAprDto: Para atualização de modelos existentes
 * - AprResponseDto: Para respostas de modelos individuais
 * - AprListResponseDto: Para respostas de listas paginadas
 * - AprQueryDto: Para parâmetros de consulta
 * - PaginationMetaDto: Para metadados de paginação
 * - DTOs de sincronização para perguntas, opções e relacionamentos
 */

// DTOs principais
export { CreateAprDto } from './create-apr.dto';
export { UpdateAprDto } from './update-apr.dto';
export { AprResponseDto } from './apr-response.dto';
export { AprListResponseDto } from './apr-list-response.dto';
export { AprQueryDto } from './apr-query.dto';

// DTOs de paginação
export { PaginationMetaDto } from './pagination-meta.dto';

// DTOs de sincronização
export { AprPerguntaSyncDto } from './apr-pergunta-sync.dto';
export { AprPerguntaRelacaoSyncDto } from './apr-pergunta-relacao-sync.dto';
export { AprOpcaoRespostaSyncDto } from './apr-opcao-resposta-sync.dto';
export { AprOpcaoRespostaRelacaoSyncDto } from './apr-opcao-resposta-relacao-sync.dto';
export { AprTipoAtividadeRelacaoSyncDto } from './apr-tipo-atividade-relacao-sync.dto';
