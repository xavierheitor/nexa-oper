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
      console.log(
        '🔍 [getChecklistsByTurno] Buscando checklists do turno:',
        data.turnoId
      );

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

      console.log(
        '✅ [getChecklistsByTurno] Checklists encontrados:',
        checklistsPreenchidos.length
      );

      // ✅ LÓGICA SIMPLIFICADA: Buscar fotos diretamente por turnoId + checklistUuid + perguntaId
      const checklistsComFotos = await Promise.all(
        checklistsPreenchidos.map(async checklist => {
          console.log(
            `🔍 [DEBUG] Processando checklist ${checklist.id} (UUID: ${checklist.uuid})`
          );

          // Buscar fotos para cada resposta específica
          const respostasComFotos = await Promise.all(
            checklist.ChecklistResposta.map(async resposta => {
              // ✅ Busca direta: turnoId + checklistUuid + perguntaId
              const fotosDaResposta = await prisma.mobilePhoto.findMany({
                where: {
                  turnoId: data.turnoId,
                  checklistUuid: checklist.uuid,
                  checklistPerguntaId: resposta.perguntaId,
                  tipo: {
                    in: ['checklistReprova', 'assinatura'],
                  },
                  deletedAt: null,
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
                },
                orderBy: {
                  createdAt: 'asc',
                },
              });

              console.log(
                `📋 [DEBUG] Resposta ${resposta.id} (perguntaId: ${resposta.perguntaId}):`,
                {
                  aguardandoFoto: resposta.aguardandoFoto,
                  fotosSincronizadas: resposta.fotosSincronizadas,
                  fotosEncontradas: fotosDaResposta.length,
                  fotos: fotosDaResposta.map(f => ({
                    id: f.id,
                    tipo: f.tipo,
                    url: f.url,
                    storagePath: f.storagePath,
                  })),
                }
              );

              // ✅ Converter para formato compatível com frontend
              const fotosFormatadas = fotosDaResposta.map(foto => ({
                id: foto.id,
                caminhoArquivo: foto.storagePath,
                urlPublica: foto.url,
                tamanhoBytes: Number(foto.fileSize), // ✅ Converter BigInt para Number
                mimeType: foto.mimeType,
                sincronizadoEm: foto.capturedAt.toISOString(),
                createdAt: foto.createdAt.toISOString(),
              }));

              return {
                ...resposta,
                ChecklistRespostaFoto: fotosFormatadas,
              };
            })
          );

          return {
            ...checklist,
            ChecklistResposta: respostasComFotos,
          };
        })
      );

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
      console.log(
        '🔍 [getChecklistByUuid] Buscando checklist por UUID:',
        data.uuid
      );

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
        console.log(
          `❌ [getChecklistByUuid] Checklist não encontrado para UUID: ${data.uuid}`
        );
        return null;
      }

      // ✅ LÓGICA SIMPLIFICADA: Buscar fotos diretamente por turnoId + checklistUuid + perguntaId
      const respostasComFotos = await Promise.all(
        checklistPreenchido.ChecklistResposta.map(async resposta => {
          // ✅ Busca direta: turnoId + checklistUuid + perguntaId
          const fotosDaResposta = await prisma.mobilePhoto.findMany({
            where: {
              turnoId: checklistPreenchido.turnoId,
              checklistUuid: data.uuid,
              checklistPerguntaId: resposta.perguntaId,
              tipo: {
                in: ['checklistReprova', 'assinatura'],
              },
              deletedAt: null,
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
            },
            orderBy: {
              createdAt: 'asc',
            },
          });

          console.log(
            `📋 [getChecklistByUuid] Resposta ${resposta.id} (perguntaId: ${resposta.perguntaId}):`,
            {
              fotosEncontradas: fotosDaResposta.length,
              fotos: fotosDaResposta.map(f => ({
                id: f.id,
                tipo: f.tipo,
                url: f.url,
              })),
            }
          );

          // ✅ Converter para formato compatível com frontend
          const fotosFormatadas = fotosDaResposta.map(foto => ({
            id: foto.id,
            caminhoArquivo: foto.storagePath,
            urlPublica: foto.url,
            tamanhoBytes: Number(foto.fileSize), // ✅ Converter BigInt para Number
            mimeType: foto.mimeType,
            sincronizadoEm: foto.capturedAt.toISOString(),
            createdAt: foto.createdAt.toISOString(),
          }));

          return {
            ...resposta,
            ChecklistRespostaFoto: fotosFormatadas,
          };
        })
      );

      const checklistComFotos = {
        ...checklistPreenchido,
        ChecklistResposta: respostasComFotos,
      };

      console.log('✅ [getChecklistByUuid] Checklist encontrado:', {
        id: checklistComFotos.id,
        uuid: checklistComFotos.uuid,
        turnoId: checklistComFotos.turnoId,
        totalRespostas: checklistComFotos.ChecklistResposta.length,
        respostasComFoto: checklistComFotos.ChecklistResposta.filter(
          r => r.ChecklistRespostaFoto.length > 0
        ).length,
      });

      return checklistComFotos;
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'getByUuid' }
  );
