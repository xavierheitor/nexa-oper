/**
 * Server Action para Criação/Atualização de Vínculo APR-TipoAtividade
 *
 * Esta Server Action implementa a criação ou atualização de vínculos
 * entre APRs e Tipos de Atividade com validação automática e
 * garantia de vínculo único por tipo.
 *
 * FUNCIONALIDADES:
 * - Validação de entrada via Zod schema
 * - Autenticação automática via session
 * - Logging automático de operações
 * - Tratamento padronizado de erros
 * - Integração com Service Layer
 * - Auditoria automática (createdBy)
 * - Vínculo único por tipo de atividade
 *
 * COMPORTAMENTO:
 * - Remove vínculos anteriores (soft delete)
 * - Cria novo vínculo ativo
 * - Garante integridade referencial
 * - Preserva histórico para auditoria
 *
 * FLUXO DE EXECUÇÃO:
 * 1. Recebe dados brutos do frontend (tipoAtividadeId, aprId)
 * 2. Valida dados usando setAprTipoAtividadeSchema
 * 3. Verifica autenticação do usuário
 * 4. Chama AprTipoAtividadeVinculoService.setMapping()
 * 5. Registra operação no log
 * 6. Retorna resultado padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // No frontend
 * const result = await setAprTipoAtividade({
 *   tipoAtividadeId: 1,
 *   aprId: 2
 * });
 *
 * if (result.success) {
 *   console.log('Vínculo criado:', result.data);
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import type { AprTipoAtividadeVinculoService } from '@/lib/services/apr/AprTipoAtividadeVinculoService';
import { setAprTipoAtividadeSchema } from '@/lib/services/apr/AprTipoAtividadeVinculoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../../common/actionHandler';

/**
 * Server Action para criar/atualizar vínculo APR-TipoAtividade
 *
 * Processa a criação ou atualização de um vínculo entre APR e
 * Tipo de Atividade com validação completa e garantia de
 * vínculo único por tipo.
 *
 * @param rawData - Dados brutos enviados pelo frontend
 * @returns Promise<ActionResult<AprTipoAtividadeRelacao>> - Resultado padronizado
 *
 * @throws {ValidationError} Se os dados de entrada forem inválidos
 * @throws {AuthenticationError} Se o usuário não estiver autenticado
 * @throws {BusinessLogicError} Se houver erro na lógica de negócio
 * @throws {ReferentialIntegrityError} Se IDs não existirem
 *
 * @example
 * ```typescript
 * // Uso em componente React com Select
 * const handleSubmit = async (formData) => {
 *   const result = await setAprTipoAtividade({
 *     tipoAtividadeId: formData.tipoAtividadeId,
 *     aprId: formData.aprId
 *   });
 *
 *   if (result.success) {
 *     message.success('Vínculo salvo com sucesso!');
 *     // Atualizar lista ou fechar modal
 *   } else {
 *     message.error(result.error);
 *   }
 * };
 *
 * // Uso em operação de substituição
 * const replaceApr = async (tipoAtividadeId, newAprId) => {
 *   const result = await setAprTipoAtividade({
 *     tipoAtividadeId,
 *     aprId: newAprId
 *   });
 *
 *   if (result.success) {
 *     console.log('APR substituída com sucesso');
 *   }
 * };
 *
 * // Uso em formulário de vinculação
 * const VinculoForm = () => {
 *   const handleSave = async (values) => {
 *     const result = await setAprTipoAtividade(values);
 *
 *     if (result.success) {
 *       // Sucesso: vínculo criado/atualizado
 *       onSuccess(result.data);
 *     } else {
 *       // Erro: mostrar mensagem de erro
 *       setError(result.error);
 *     }
 *   };
 * };
 * ```
 */
export const setAprTipoAtividade = async (rawData: unknown) =>
  handleServerAction(
    // Schema de validação Zod
    setAprTipoAtividadeSchema,

    // Lógica de negócio
    async (validatedData, session) => {
      // Obtém instância do service via container de DI
      const service = container.get<AprTipoAtividadeVinculoService>(
        'aprTipoAtividadeVinculoService'
      );

      // Executa criação/atualização com ID do usuário autenticado
      return service.setMapping(validatedData, session.user.id);
    },

    // Dados brutos para validação
    rawData,

    // Metadados para logging e auditoria
    {
      entityName: 'AprTipoAtividadeRelacao',
      actionType: 'set',
    }
  );

