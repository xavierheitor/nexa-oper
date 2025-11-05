/**
 * Server Action para buscar checklists preenchidos de um turno
 *
 * Esta action recupera todos os checklists preenchidos de um turno específico,
 * incluindo respostas e fotos associadas.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { formatChecklistPhotos } from '@/lib/utils/checklistPhotoFormatter';
import { z } from 'zod';

const getChecklistsByTurnoSchema = z.object({
  turnoId: z.number().int().positive(),
});

const getChecklistByUuidSchema = z.object({
  uuid: z.string().uuid(),
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
    async data => {
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

      // ✅ OTIMIZAÇÃO: Buscar todas as fotos de uma vez (evita N+1 queries)
      // Busca todas as fotos do turno de uma vez
      const todasFotos = await prisma.mobilePhoto.findMany({
        where: {
          turnoId: data.turnoId,
          tipo: {
            in: ['checklistReprova', 'assinatura'],
          },
          deletedAt: null,
          // Filtra apenas fotos dos checklists que foram encontrados
          checklistUuid: {
            in: checklistsPreenchidos.map(c => c.uuid),
          },
        },
        select: {
          id: true,
          tipo: true,
          url: true,
          storagePath: true,
          fileSize: true,
          mimeType: true,
          capturedAt: true,
          createdAt: true,
          checklistUuid: true,
          checklistPerguntaId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Agrupa fotos por checklistUuid + perguntaId para acesso rápido
      const fotosPorResposta = new Map<string, typeof todasFotos>();
      todasFotos.forEach(foto => {
        if (foto.checklistUuid && foto.checklistPerguntaId) {
          const key = `${foto.checklistUuid}-${foto.checklistPerguntaId}`;
          if (!fotosPorResposta.has(key)) {
            fotosPorResposta.set(key, []);
          }
          fotosPorResposta.get(key)!.push(foto);
        }
      });

      // Mapeia checklists e respostas usando as fotos já carregadas
      const checklistsComFotos = checklistsPreenchidos.map(checklist => {
        const respostasComFotos = checklist.ChecklistResposta.map(resposta => {
          const key = `${checklist.uuid}-${resposta.perguntaId}`;
          const fotosDaResposta = fotosPorResposta.get(key) || [];
          const fotosFormatadas = formatChecklistPhotos(fotosDaResposta);

          return {
            ...resposta,
            ChecklistRespostaFoto: fotosFormatadas,
          };
        });

        return {
          ...checklist,
          ChecklistResposta: respostasComFotos,
        };
      });

      return checklistsComFotos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByTurno' }
  );

/**
 * Busca um checklist preenchido específico por UUID
 *
 * @param rawData - Dados contendo o UUID do checklist
 * @returns Checklist preenchido com respostas e fotos
 */
export const getChecklistByUuid = async (rawData: unknown) =>
  handleServerAction(
    getChecklistByUuidSchema,
    async data => {
      const checklistPreenchido = await prisma.checklistPreenchido.findUnique({
        where: {
          uuid: data.uuid,
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
      });

      if (!checklistPreenchido) {
        return null;
      }

      // ✅ OTIMIZAÇÃO: Buscar todas as fotos de uma vez (evita N+1 queries)
      // Busca todas as fotos do checklist de uma vez
      const todasFotos = await prisma.mobilePhoto.findMany({
        where: {
          turnoId: checklistPreenchido.turnoId,
          checklistUuid: data.uuid,
          tipo: {
            in: ['checklistReprova', 'assinatura'],
          },
          deletedAt: null,
          // Filtra apenas fotos das perguntas que têm respostas
          checklistPerguntaId: {
            in: checklistPreenchido.ChecklistResposta.map(r => r.perguntaId),
          },
        },
        select: {
          id: true,
          tipo: true,
          url: true,
          storagePath: true,
          fileSize: true,
          mimeType: true,
          capturedAt: true,
          createdAt: true,
          checklistPerguntaId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Agrupa fotos por perguntaId para acesso rápido
      const fotosPorPergunta = new Map<number, typeof todasFotos>();
      todasFotos.forEach(foto => {
        if (foto.checklistPerguntaId) {
          if (!fotosPorPergunta.has(foto.checklistPerguntaId)) {
            fotosPorPergunta.set(foto.checklistPerguntaId, []);
          }
          fotosPorPergunta.get(foto.checklistPerguntaId)!.push(foto);
        }
      });

      // Mapeia respostas usando as fotos já carregadas
      const respostasComFotos = checklistPreenchido.ChecklistResposta.map(resposta => {
        const fotosDaResposta = fotosPorPergunta.get(resposta.perguntaId) || [];
        const fotosFormatadas = formatChecklistPhotos(fotosDaResposta);

        return {
          ...resposta,
          ChecklistRespostaFoto: fotosFormatadas,
        };
      });

      const checklistComFotos = {
        ...checklistPreenchido,
        ChecklistResposta: respostasComFotos,
      };

      return checklistComFotos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByUuid' }
  );
