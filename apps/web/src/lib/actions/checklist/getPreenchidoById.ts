/**
 * Server Action para buscar um checklist preenchido por ID
 *
 * Esta action recupera um checklist preenchido completo com todas as informações:
 * - Dados do checklist
 * - Dados do eletricista
 * - Dados do turno, equipe e veículo
 * - Todas as respostas com perguntas e opções
 * - Fotos associadas às respostas
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';

const getChecklistPreenchidoByIdSchema = z.object({
  id: z.number().int().positive(),
});

export const getChecklistPreenchidoById = async (rawData: unknown) =>
  handleServerAction(
    getChecklistPreenchidoByIdSchema,
    async (data) => {
      const checklist = await prisma.checklistPreenchido.findUnique({
        where: {
          id: data.id,
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
          turno: {
            include: {
              equipe: {
                include: {
                  tipoEquipe: true,
                },
              },
              veiculo: {
                select: {
                  id: true,
                  placa: true,
                  modelo: true,
                },
              },
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
      });

      if (!checklist) {
        throw new Error('Checklist não encontrado');
      }

      // Formatar os dados
      return {
        id: checklist.id,
        uuid: checklist.uuid,
        turnoId: checklist.turnoId,
        checklistId: checklist.checklistId,
        eletricistaId: checklist.eletricistaId,
        dataPreenchimento: checklist.dataPreenchimento,
        latitude: checklist.latitude,
        longitude: checklist.longitude,
        checklist: {
          id: checklist.checklist.id,
          nome: checklist.checklist.nome,
          tipoChecklist: {
            id: checklist.checklist.tipoChecklist.id,
            nome: checklist.checklist.tipoChecklist.nome,
          },
        },
        eletricista: {
          id: checklist.eletricista.id,
          nome: checklist.eletricista.nome,
          matricula: checklist.eletricista.matricula,
        },
        turno: {
          id: checklist.turno.id,
          equipe: {
            id: checklist.turno.equipe.id,
            nome: checklist.turno.equipe.nome,
            tipoEquipe: {
              id: checklist.turno.equipe.tipoEquipe.id,
              nome: checklist.turno.equipe.tipoEquipe.nome,
            },
          },
          veiculo: checklist.turno.veiculo,
        },
        ChecklistResposta: checklist.ChecklistResposta,
      };
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'read' }
  );

