/**
 * Server Action para Atualização de Contratos
 *
 * Esta action implementa a atualização de contratos através
 * de Server Actions do Next.js, incluindo validação de dados,
 * autenticação, auditoria automática e logging.
 *
 * FUNCIONALIDADES:
 * - Validação completa de dados com Zod
 * - Autenticação obrigatória
 * - Atualização de contrato existente
 * - Auditoria automática (updatedBy, updatedAt)
 * - Verificação de existência do contrato
 * - Logging automático da operação
 * - Tratamento de erros padronizado
 *
 * COMO FUNCIONA:
 * 1. Valida dados de entrada com contratoUpdateSchema
 * 2. Verifica autenticação do usuário
 * 3. Adiciona campos de auditoria automaticamente
 * 4. Verifica se o contrato existe
 * 5. Atualiza o contrato no banco de dados
 * 6. Retorna o contrato atualizado
 * 7. Registra a operação nos logs
 *
 * CAMPOS OBRIGATÓRIOS:
 * - id: ID do contrato a ser atualizado
 * - nome: Nome do contrato (1-255 caracteres)
 * - numero: Número do contrato (1-255 caracteres)
 *
 * CAMPOS OPCIONAIS:
 * - dataInicio: Data de início do contrato
 * - dataFim: Data de fim do contrato
 *
 * CAMPOS AUTOMÁTICOS (adicionados pela action):
 * - updatedBy: ID do usuário que fez a atualização
 * - updatedAt: Timestamp da atualização
 *
 * EXEMPLO DE USO:
 * ```typescript
 * // Atualizar contrato
 * const result = await updateContrato({
 *   id: 123,
 *   nome: 'Contrato Atualizado',
 *   numero: 'CT001-UPD',
 *   dataInicio: new Date('2024-01-01'),
 *   dataFim: new Date('2024-12-31')
 * });
 *
 * if (result.success) {
 *   console.log('Contrato atualizado:', result.data);
 * } else {
 *   console.error('Erro na atualização:', result.error);
 * }
 *
 * // Uso em formulário React
 * const handleUpdateContrato = async (formData: ContratoUpdateData) => {
 *   const result = await updateContrato(formData);
 *
 *   if (result.success) {
 *     toast.success('Contrato atualizado com sucesso!');
 *     router.push('/contratos');
 *   } else {
 *     toast.error(result.error);
 *   }
 * };
 * ```
 */

'use server';

import { contratoUpdateSchema } from '@/lib/schemas/contratoSchema';
import type { ContratoService } from '@/lib/services/ContratoService';
import { container } from '@/lib/services/common/registerServices';
import { handleServerAction } from '../common/actionHandler';

/**
 * Atualiza um contrato existente
 *
 * @param rawData - Dados brutos do contrato a ser atualizado
 * @returns Resultado da operação com o contrato atualizado
 */
export const updateContrato = async (rawData: unknown) =>
  handleServerAction(
    contratoUpdateSchema,
    async (data, session) => {
      // Obtém o serviço do container
      const service = container.get<ContratoService>('contratoService');

      // Atualiza o contrato com auditoria automática
      return service.update(data, session.user.id);
    },
    rawData,
    { entityName: 'Contrato', actionType: 'update' }
  );
