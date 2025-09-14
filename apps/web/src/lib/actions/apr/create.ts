/**
 * Server Action para Criação de APR
 *
 * Esta Server Action implementa a criação de novas APRs (Análise Preliminar de Risco)
 * com validação automática, tratamento de erros, logging completo e vinculação
 * automática de perguntas e opções de resposta.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (createdBy)
 * - Vinculação automática de relacionamentos
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos do frontend (nome, perguntaIds, opcaoRespostaIds)
 * 2. Valida dados usando aprCreateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprService.create() que:
 *    - Cria a APR base
 *    - Vincula perguntas selecionadas
 *    - Vincula opções de resposta selecionadas
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await createApr({
 *   nome: "APR Soldagem",
 *   perguntaIds: [1, 2, 3],
 *   opcaoRespostaIds: [1, 2]
 * });
 * 
 * if (result.success) {
 *   console.log('APR criada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprService } from '@/lib/services/AprService';
import { container } from '@/lib/services/common/registerServices';
import { aprCreateSchema } from '../../schemas/aprSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para criar nova APR
 *
 * Processa a criação de uma nova APR com validação completa,
 * integração automática com o sistema de auditoria e vinculação
 * automática de perguntas e opções de resposta.
 *
 * @param rawData - Dados brutos enviados pelo frontend
 * @returns Promise<ActionResult<Apr>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 * @throws {ReferentialIntegrityError} Se IDs de pergunta/opção não existirem
 *
 * @example
 * ```typescript
 * // Uso em componente React com Transfer
 * const handleSubmit = async (formData) => {
 *   const result = await createApr({
 *     nome: formData.nome,
 *     perguntaIds: selectedPerguntas, // Do Transfer component
 *     opcaoRespostaIds: selectedOpcoes // Do Transfer component
 *   });
 *   
 *   if (result.success) {
 *     message.success('APR criada com sucesso!');
 *     // Atualizar lista ou fechar modal
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * 
 * // Uso em operação batch
 * const createMultiple = async (aprsData) => {
 *   const results = await Promise.allSettled(
 *     aprsData.map(data => createApr(data))
 *   );
 *   
 *   const successful = results.filter(r => 
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *   
 *   message.info(`${successful} APRs criadas`);
 * };
 * ```
 */
export const createApr = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod
    aprCreateSchema,
    
    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprService>('aprService');
      
      // Executa criação com ID do usuário autenticado
      return service.create(validatedData, session.user.id);
    },
    
    // Dados brutos para validação
    rawData,
    
    // Metadados para logging e auditoria
    { 
      entityName: 'Apr', 
      actionType: 'create' 
    }
  );
