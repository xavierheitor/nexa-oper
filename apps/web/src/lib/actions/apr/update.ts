/**
 * Server Action para Atualização de APR
 *
 * Esta Server Action implementa a atualização de APRs existentes
 * com validação automática, controle de versão, auditoria completa
 * e reconfiguração de relacionamentos.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Verificação de existência da APR
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (updatedBy, updatedAt)
 * - Reconfiguração de relacionamentos
 *
 * CAMPOS ATUALIZÁVEIS:
 * - nome: Nome/título da APR
 * - perguntaIds: Array de IDs de perguntas (reconfigura vínculos)
 * - opcaoRespostaIds: Array de IDs de opções (reconfigura vínculos)
 * - Campos de auditoria são atualizados automaticamente
 *
 * COMPORTAMENTO DOS RELACIONAMENTOS:
 * - Remove vínculos não presentes nos novos arrays (soft delete)
 * - Mantém vínculos que permanecem inalterados
 * - Adiciona novos vínculos presentes nos arrays
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos incluindo ID
 * 2. Valida dados usando aprUpdateSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprService.update() que:
 *    - Atualiza a APR base
 *    - Reconfigura vínculos com perguntas
 *    - Reconfigura vínculos com opções de resposta
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await updateApr({
 *   id: 1,
 *   nome: "APR Soldagem - Revisão 2",
 *   perguntaIds: [2, 3, 4], // Nova configuração
 *   opcaoRespostaIds: [1]   // Nova configuração
 * });
 * 
 * if (result.success) {
 *   console.log('APR atualizada:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprService } from '@/lib/services/AprService';
import { container } from '@/lib/services/common/registerServices';
import { aprUpdateSchema } from '../../schemas/aprSchema';
import { handleServerAction } from '../common/actionHandler';

/**
 * Server Action para atualizar APR existente
 *
 * Processa a atualização de uma APR com validação completa,
 * integração automática com o sistema de auditoria e
 * reconfiguração automática de relacionamentos.
 *
 * @param rawData - Dados brutos incluindo ID e campos a atualizar
 * @returns Promise<ActionResult<Apr>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {NotFoundError} Se a APR não for encontrada
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 * @throws {ReferentialIntegrityError} Se IDs de pergunta/opção não existirem
 *
 * @example
 * ```typescript
 * // Uso em componente de edição com Transfer
 * const handleUpdate = async (formData) => {
 *   const result = await updateApr({
 *     id: editingApr.id,
 *     nome: formData.nome,
 *     perguntaIds: selectedPerguntas, // Do Transfer component
 *     opcaoRespostaIds: selectedOpcoes // Do Transfer component
 *   });
 *   
 *   if (result.success) {
 *     message.success('APR atualizada com sucesso!');
 *     closeModal();
 *     refreshList();
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 * 
 * // Uso em operação batch
 * const updateMultiple = async (aprs) => {
 *   const results = await Promise.allSettled(
 *     aprs.map(a => updateApr(a))
 *   );
 *   
 *   const successful = results.filter(r => 
 *     r.status === 'fulfilled' && r.value.success
 *   ).length;
 *   
 *   message.info(`${successful} APRs atualizadas`);
 * };
 * 
 * // Uso para reconfiguração de vínculos
 * const reconfigureLinks = async (aprId, newPerguntas, newOpcoes) => {
 *   // Mantém nome atual, apenas reconfigura vínculos
 *   const currentApr = await getApr({ id: aprId });
 *   if (currentApr.success) {
 *     await updateApr({
 *       id: aprId,
 *       nome: currentApr.data.nome,
 *       perguntaIds: newPerguntas,
 *       opcaoRespostaIds: newOpcoes
 *     });
 *   }
 * };
 * ```
 */
export const updateApr = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod (inclui ID obrigatório)
    aprUpdateSchema,
    
    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprService>('aprService');
      
      // Executa atualização com ID do usuário autenticado
      return service.update(validatedData, session.user.id);
    },
    
    // Dados brutos para validação
    rawData,
    
    // Metadados para logging e auditoria
    { 
      entityName: 'Apr', 
      actionType: 'update' 
    }
  );
