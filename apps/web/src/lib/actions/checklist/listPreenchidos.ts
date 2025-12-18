/**
 * Server Action para buscar checklists preenchidos com filtros
 *
 * Esta action recupera checklists preenchidos com filtros avançados:
 * - Data (período)
 * - Tipo de equipe
 * - Equipe
 * - Placa do veículo
 * - Eletricista
 * - Base
 * - Tipo de checklist
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import dayjs from 'dayjs';

const listChecklistsPreenchidosSchema = z.object({
  dataInicio: z.union([z.date(), z.string()]).optional(),
  dataFim: z.union([z.date(), z.string()]).optional(),
  tipoEquipeId: z.number().int().positive().optional(),
  equipeId: z.number().int().positive().optional(),
  veiculoPlaca: z.string().optional(),
  eletricistaId: z.number().int().positive().optional(),
  baseId: z.number().int().positive().optional(),
  tipoChecklistId: z.number().int().positive().optional(),
  checklistId: z.number().int().positive().optional(),
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().optional().default(20),
});

export const listChecklistsPreenchidos = async (rawData: unknown) =>
  handleServerAction(
    listChecklistsPreenchidosSchema,
    async (data) => {
      // Converter strings para Date se necessário
      const dataInicio = data.dataInicio
        ? (typeof data.dataInicio === 'string' ? new Date(data.dataInicio) : data.dataInicio)
        : dayjs().startOf('month').toDate();

      const dataFim = data.dataFim
        ? (typeof data.dataFim === 'string' ? new Date(data.dataFim) : data.dataFim)
        : dayjs().endOf('month').toDate();

      // Ajustar dataFim para o final do dia
      const dataFimAjustada = dayjs(dataFim).endOf('day').toDate();

      // Construir filtros para o turno (equipe, base, veículo)
      const whereTurno: any = {
        deletedAt: null,
      };

      if (data.equipeId) {
        whereTurno.equipeId = data.equipeId;
      }

      if (data.veiculoPlaca) {
        whereTurno.veiculo = {
          placa: {
            contains: data.veiculoPlaca,
          },
          deletedAt: null,
        };
      }

      // Filtro por base (através da equipe)
      if (data.baseId) {
        whereTurno.equipe = {
          ...whereTurno.equipe,
          EquipeBaseHistorico: {
            some: {
              baseId: data.baseId,
              dataFim: null,
              deletedAt: null,
            },
          },
          deletedAt: null,
        };
      }

      // Filtro por tipo de equipe (através da equipe)
      if (data.tipoEquipeId) {
        whereTurno.equipe = {
          ...whereTurno.equipe,
          tipoEquipeId: data.tipoEquipeId,
          deletedAt: null,
        };
      }

      // Construir filtros para o checklist preenchido
      const where: any = {
        deletedAt: null,
        dataPreenchimento: {
          gte: dataInicio,
          lte: dataFimAjustada,
        },
      };

      // Adicionar filtros do turno se houver
      if (Object.keys(whereTurno).length > 0) {
        where.turno = whereTurno;
      }

      if (data.eletricistaId) {
        where.eletricistaId = data.eletricistaId;
      }

      if (data.checklistId) {
        where.checklistId = data.checklistId;
      }

      // Filtro por tipo de checklist (através do checklist)
      if (data.tipoChecklistId) {
        where.checklist = {
          ...where.checklist,
          tipoChecklistId: data.tipoChecklistId,
          deletedAt: null,
        };
      }

      // Paginação
      const page = data.page || 1;
      const pageSize = data.pageSize || 20;
      const skip = (page - 1) * pageSize;

      // Buscar checklists preenchidos
      const [checklists, total] = await Promise.all([
        prisma.checklistPreenchido.findMany({
          where,
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
                pergunta: true,
                opcaoResposta: true,
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
            dataPreenchimento: 'desc',
          },
          skip,
          take: pageSize,
        }),
        prisma.checklistPreenchido.count({ where }),
      ]);

      // Formatar os dados
      const formattedChecklists = checklists.map((checklist) => ({
        id: checklist.id,
        uuid: checklist.uuid,
        turnoId: checklist.turnoId,
        checklistId: checklist.checklistId,
        eletricistaId: checklist.eletricistaId,
        dataPreenchimento: checklist.dataPreenchimento,
        latitude: checklist.latitude ?? undefined,
        longitude: checklist.longitude ?? undefined,
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
      }));

      return {
        data: formattedChecklists,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    },
    rawData,
    { entityName: 'ChecklistPreenchido', actionType: 'read' }
  );

