/**
 * Server Action para buscar checklists preenchidos de um turno
 *
 * Esta action recupera todos os checklists preenchidos de um turno específico,
 * incluindo respostas e fotos associadas.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const getChecklistsByTurnoSchema = z.object({
  turnoId: z.number().int().positive(),
});

/**
 * Busca checklists preenchidos de um turno específico
 *
 * @param rawData - Dados contendo o ID do turno
 * @returns Lista de checklists preenchidos com respostas e fotos
 */
export const getChecklistsByTurno = async (rawData: unknown) =>
  handleServerAction(
    getChecklistsByTurnoSchema,
    async (data) => {
      console.log('🔍 [getChecklistsByTurno] Buscando checklists do turno:', data.turnoId);

      const checklistsPreenchidos = await prisma.checklistPreenchido.findMany({
        where: {
          turnoId: data.turnoId,
          deletedAt: null,
        },
        include: {
          checklist: {
            include: {
              tipoChecklist: true,
            },
          },
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
          ChecklistResposta: {
            where: {
              deletedAt: null,
            },
            include: {
              pergunta: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              opcaoResposta: {
                select: {
                  id: true,
                  nome: true,
                  geraPendencia: true,
                },
              },
              ChecklistRespostaFoto: {
                where: {
                  deletedAt: null,
                },
                select: {
                  id: true,
                  caminhoArquivo: true,
                  urlPublica: true,
                  tamanhoBytes: true,
                  mimeType: true,
                  sincronizadoEm: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              dataResposta: 'asc',
            },
          },
        },
        orderBy: {
          dataPreenchimento: 'asc',
        },
      });

      console.log('✅ [getChecklistsByTurno] Checklists encontrados:', checklistsPreenchidos.length);

      return checklistsPreenchidos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByTurno' }
  );
