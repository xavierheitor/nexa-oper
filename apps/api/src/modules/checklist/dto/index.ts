/**
 * Arquivo de índice para exportação de todos os DTOs do módulo Checklist
 *
 * Este arquivo centraliza todas as exportações dos DTOs relacionados
 * aos checklists de segurança para facilitar a importação em outros
 * módulos e arquivos.
 *
 * DTOs disponíveis:
 * - CreateChecklistDto: Para criação de novos checklists
 * - UpdateChecklistDto: Para atualização de checklists existentes
 * - ChecklistResponseDto: Para respostas individuais
 * - ChecklistListResponseDto: Para respostas paginadas
 * - ChecklistQueryDto: Para parâmetros de consulta
 * - PaginationMetaDto: Para metadados de paginação
 * - DTOs de sincronização para perguntas, opções e relacionamentos
 */

// DTOs principais
export { CreateChecklistDto } from './create-checklist.dto';
export { UpdateChecklistDto } from './update-checklist.dto';
export {
  ChecklistResponseDto,
  ChecklistTipoChecklistDto,
} from './checklist-response.dto';
export { ChecklistListResponseDto } from './checklist-list-response.dto';
export { ChecklistQueryDto } from './checklist-query.dto';

// DTOs de paginação
export { PaginationMetaDto } from './pagination-meta.dto';

// DTOs de sincronização
export { ChecklistPerguntaSyncDto } from './checklist-pergunta-sync.dto';
export { ChecklistPerguntaRelacaoSyncDto } from './checklist-pergunta-relacao-sync.dto';
export { ChecklistOpcaoRespostaSyncDto } from './checklist-opcao-resposta-sync.dto';
export { ChecklistOpcaoRespostaRelacaoSyncDto } from './checklist-opcao-resposta-relacao-sync.dto';
export { ChecklistTipoVeiculoRelacaoSyncDto } from './checklist-tipo-veiculo-relacao-sync.dto';
export { ChecklistTipoEquipeRelacaoSyncDto } from './checklist-tipo-equipe-relacao-sync.dto';
