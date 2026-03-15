'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { requireActivitiesPermission } from '@/lib/actions/common/permissionGuard';

const getAtividadeExecucaoDetalheSchema = z.object({
  id: z.number().int().positive(),
});

export const getAtividadeExecucaoDetalhe = async (rawData: unknown) =>
  handleServerAction(
    getAtividadeExecucaoDetalheSchema,
    async (data, session) => {
      requireActivitiesPermission(session);
      const atividade = await prisma.atividadeExecucao.findFirst({
        where: {
          id: data.id,
          deletedAt: null,
        },
        include: {
          tipoAtividade: {
            select: { id: true, nome: true },
          },
          tipoAtividadeServico: {
            select: { id: true, nome: true },
          },
          turno: {
            select: {
              id: true,
              dataInicio: true,
              dataFim: true,
              equipe: {
                select: { id: true, nome: true },
              },
              veiculo: {
                select: { id: true, placa: true, modelo: true },
              },
              TurnoEletricistas: {
                where: { deletedAt: null },
                select: {
                  id: true,
                  motorista: true,
                  eletricista: {
                    select: { id: true, nome: true },
                  },
                },
              },
            },
          },
          atividadeFotos: {
            where: { deletedAt: null },
            select: {
              id: true,
              ref: true,
              contexto: true,
              mimeType: true,
              fileName: true,
              storagePath: true,
              url: true,
              capturedAt: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          atividadeMedidor: {
            include: {
              instaladoFoto: {
                select: {
                  id: true,
                  ref: true,
                  contexto: true,
                  mimeType: true,
                  fileName: true,
                  storagePath: true,
                  url: true,
                  capturedAt: true,
                  createdAt: true,
                },
              },
              retiradoFoto: {
                select: {
                  id: true,
                  ref: true,
                  contexto: true,
                  mimeType: true,
                  fileName: true,
                  storagePath: true,
                  url: true,
                  capturedAt: true,
                  createdAt: true,
                },
              },
            },
          },
          atividadeMateriaisAplicados: {
            include: {
              materialCatalogo: {
                select: {
                  id: true,
                  codigo: true,
                  descricao: true,
                },
              },
            },
            orderBy: { id: 'asc' },
          },
          atividadeFormRespostas: {
            include: {
              foto: {
                select: {
                  id: true,
                  ref: true,
                  contexto: true,
                  mimeType: true,
                  fileName: true,
                  storagePath: true,
                  url: true,
                  capturedAt: true,
                  createdAt: true,
                },
              },
            },
            orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
          },
          atividadeEventos: {
            orderBy: { capturadoEm: 'asc' },
          },
          atividadeAprPreenchidas: {
            where: { deletedAt: null },
            include: {
              apr: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              respostas: {
                orderBy: [{ ordemGrupo: 'asc' }, { ordemPergunta: 'asc' }],
              },
              assinaturas: {
                orderBy: { assinaturaData: 'asc' },
                select: {
                  id: true,
                  nomeAssinante: true,
                  matriculaAssinante: true,
                  assinaturaData: true,
                  assinanteExtra: true,
                },
              },
            },
            orderBy: { preenchidaEm: 'desc' },
          },
        },
      });

      if (!atividade) {
        throw new Error('Atividade não encontrada');
      }

      const aprRefs = atividade.atividadeAprPreenchidas
        .map(apr => apr.aprUuid)
        .filter((value): value is string => Boolean(value));

      const [
        uploadLinksAtividade,
        uploadLinksApr,
        uploadEvidenciasAtividadeLegado,
        uploadEvidenciasAprLegado,
      ] = await Promise.all([
        prisma.uploadEvidenceLink.findMany({
          where: {
            ownerType: { in: ['atividade', 'atividadeMedidor'] },
            OR: [
              {
                ownerRef: {
                  in: [atividade.atividadeUuid, String(atividade.id)],
                },
              },
              { atividadeUuid: atividade.atividadeUuid },
            ],
          },
          select: {
            photoCategory: true,
            ownerType: true,
            ownerRef: true,
            atividadeContexto: true,
            aprUuid: true,
            uploadEvidence: {
              select: {
                id: true,
                tipo: true,
                entityType: true,
                entityId: true,
                url: true,
                path: true,
                tamanho: true,
                mimeType: true,
                nomeArquivo: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        }),
        aprRefs.length
          ? prisma.uploadEvidenceLink.findMany({
              where: {
                ownerType: 'apr',
                ownerRef: { in: aprRefs },
              },
              select: {
                photoCategory: true,
                ownerType: true,
                ownerRef: true,
                atividadeContexto: true,
                aprUuid: true,
                uploadEvidence: {
                  select: {
                    id: true,
                    tipo: true,
                    entityType: true,
                    entityId: true,
                    url: true,
                    path: true,
                    tamanho: true,
                    mimeType: true,
                    nomeArquivo: true,
                    createdAt: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
        prisma.uploadEvidence.findMany({
          where: {
            tipo: 'atividade-turno',
            entityId: {
              in: [String(atividade.id), atividade.atividadeUuid],
            },
          },
          select: {
            id: true,
            tipo: true,
            entityType: true,
            entityId: true,
            url: true,
            path: true,
            tamanho: true,
            mimeType: true,
            nomeArquivo: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
        atividade.atividadeAprPreenchidas.length
          ? prisma.uploadEvidence.findMany({
              where: {
                tipo: 'apr-evidence',
                entityId: {
                  in: atividade.atividadeAprPreenchidas.map(apr =>
                    String(apr.id)
                  ),
                },
              },
              select: {
                id: true,
                tipo: true,
                entityType: true,
                entityId: true,
                url: true,
                path: true,
                tamanho: true,
                mimeType: true,
                nomeArquivo: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'asc' },
            })
          : Promise.resolve([]),
      ]);

      const uploadEvidenciasAtividade = [
        ...uploadLinksAtividade.map(item => ({
          ...item.uploadEvidence,
          photoCategory: item.photoCategory,
          ownerType: item.ownerType,
          ownerRef: item.ownerRef,
          atividadeContexto: item.atividadeContexto,
          aprUuid: item.aprUuid,
        })),
        ...uploadEvidenciasAtividadeLegado.map(item => ({
          ...item,
          photoCategory: null as string | null,
          ownerType: null as string | null,
          ownerRef: null as string | null,
          atividadeContexto: null as string | null,
          aprUuid: null as string | null,
        })),
      ].filter(
        (item, index, list) => list.findIndex(it => it.id === item.id) === index
      );

      const uploadEvidenciasApr = [
        ...uploadLinksApr.map(item => ({
          ...item.uploadEvidence,
          photoCategory: item.photoCategory,
          ownerType: item.ownerType,
          ownerRef: item.ownerRef,
          atividadeContexto: item.atividadeContexto,
          aprUuid: item.aprUuid,
        })),
        ...uploadEvidenciasAprLegado.map(item => ({
          ...item,
          photoCategory: null as string | null,
          ownerType: null as string | null,
          ownerRef: null as string | null,
          atividadeContexto: null as string | null,
          aprUuid: null as string | null,
        })),
      ].filter(
        (item, index, list) => list.findIndex(it => it.id === item.id) === index
      );

      type AprUploadEvidenceItem = (typeof uploadEvidenciasApr)[number];
      const evidenciasAprPorId = uploadEvidenciasApr.reduce<
        Record<string, AprUploadEvidenceItem[]>
      >((acc, evidencia) => {
        const keys = Array.from(
          new Set(
            [evidencia.aprUuid, evidencia.ownerRef, evidencia.entityId].filter(
              (value): value is string => Boolean(value)
            )
          )
        );
        for (const key of keys) {
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(evidencia);
        }
        return acc;
      }, {});

      return {
        ...atividade,
        atividadeAprPreenchidas: atividade.atividadeAprPreenchidas.map(apr => {
          const evidenciasRaw =
            evidenciasAprPorId[apr.aprUuid] ||
            evidenciasAprPorId[String(apr.id)] ||
            [];
          const evidenciasUpload = evidenciasRaw.filter(
            (item, index, list) =>
              list.findIndex(it => it.id === item.id) === index
          );
          return {
            ...apr,
            evidenciasUpload,
          };
        }),
        uploadEvidenciasAtividade,
      };
    },
    rawData,
    { entityName: 'AtividadeExecucao', actionType: 'read' }
  );
