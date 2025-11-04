/**
 * Server Action para Registrar/Alterar Status de Eletricista
 *
 * Esta action implementa a alteração de status de eletricista,
 * atualizando o status atual e criando registro no histórico.
 *
 * FUNCIONALIDADES:
 * - Atualiza status atual do eletricista
 * - Cria registro no histórico
 * - Fecha registro anterior no histórico (se existir)
 * - Validação de dados com Zod
 * - Autenticação obrigatória
 * - Auditoria automática
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * const result = await registrarStatusEletricista({
 *   eletricistaId: 1,
 *   status: 'FERIAS',
 *   dataInicio: new Date(),
 *   motivo: 'Férias anuais'
 * });
 *
 * if (result.success) {
 *   console.log('Status alterado com sucesso');
 * } else {
 *   console.error('Erro:', result.error);
 * }
 * ```
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { registrarStatusSchema } from '@/lib/schemas/eletricistaStatusSchema';
import { StatusEletricista } from '@nexa-oper/db';
import { handleServerAction } from '../common/actionHandler';

/**
 * Registra/atualiza o status de um eletricista
 *
 * @param rawData - Dados do status (eletricistaId, status, dataInicio, etc.)
 * @returns Resultado da operação
 */
export const registrarStatusEletricista = async (rawData: unknown) =>
  handleServerAction(
    registrarStatusSchema,
    async (data, session) => {
      const { eletricistaId, status, dataInicio, dataFim, motivo, observacoes, documentoPath } = data;

      // 1. Verifica se o eletricista existe
      const eletricista = await prisma.eletricista.findUnique({
        where: { id: eletricistaId },
        select: { id: true, deletedAt: true },
      });

      if (!eletricista || eletricista.deletedAt) {
        throw new Error('Eletricista não encontrado');
      }

      // 2. Obtém o status atual (se existir)
      const statusAtual = await prisma.eletricistaStatus.findUnique({
        where: { eletricistaId },
      });

      const statusAnterior = statusAtual?.status || StatusEletricista.ATIVO;

      // 3. Fecha registro anterior no histórico (se existir e não tiver data fim)
      if (statusAtual) {
        await prisma.eletricistaStatusHistorico.updateMany({
          where: {
            eletricistaId,
            dataFim: null,
          },
          data: {
            dataFim: dataInicio || new Date(),
            updatedBy: session.user.id,
            updatedAt: new Date(),
          },
        });
      }

      // 4. Cria novo registro no histórico
      await prisma.eletricistaStatusHistorico.create({
        data: {
          eletricistaId,
          status: status as StatusEletricista,
          statusAnterior: statusAnterior !== status ? statusAnterior : null,
          dataInicio: dataInicio || new Date(),
          dataFim: dataFim || null,
          motivo: motivo || null,
          observacoes: observacoes || null,
          documentoPath: documentoPath || null,
          registradoPor: session.user.id,
          createdBy: session.user.id,
          createdAt: new Date(),
        },
      });

      // 5. Atualiza ou cria status atual
      const novoStatus = await prisma.eletricistaStatus.upsert({
        where: { eletricistaId },
        create: {
          eletricistaId,
          status: status as StatusEletricista,
          dataInicio: dataInicio || new Date(),
          dataFim: dataFim || null,
          motivo: motivo || null,
          observacoes: observacoes || null,
          documentoPath: documentoPath || null,
          createdBy: session.user.id,
          createdAt: new Date(),
        },
        update: {
          status: status as StatusEletricista,
          dataInicio: dataInicio || new Date(),
          dataFim: dataFim || null,
          motivo: motivo || null,
          observacoes: observacoes || null,
          documentoPath: documentoPath || null,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      return novoStatus;
    },
    rawData,
    { entityName: 'EletricistaStatus', actionType: 'update' }
  );

