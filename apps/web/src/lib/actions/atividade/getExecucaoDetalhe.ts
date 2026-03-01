'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';

const getAtividadeExecucaoDetalheSchema = z.object({
  id: z.number().int().positive(),
});

export const getAtividadeExecucaoDetalhe = async (rawData: unknown) =>
  handleServerAction(
    getAtividadeExecucaoDetalheSchema,
    async (data) => {
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

      const [uploadEvidenciasAtividade, uploadEvidenciasApr] = await Promise.all([
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
                  in: atividade.atividadeAprPreenchidas.map((apr) =>
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

      type AprUploadEvidenceItem = (typeof uploadEvidenciasApr)[number];
      const evidenciasAprPorId = uploadEvidenciasApr.reduce<
        Record<string, AprUploadEvidenceItem[]>
      >((acc, evidencia) => {
        if (!acc[evidencia.entityId]) {
          acc[evidencia.entityId] = [];
        }
        acc[evidencia.entityId].push(evidencia);
        return acc;
      }, {});

      return {
        ...atividade,
        atividadeAprPreenchidas: atividade.atividadeAprPreenchidas.map((apr) => ({
          ...apr,
          evidenciasUpload: evidenciasAprPorId[String(apr.id)] || [],
        })),
        uploadEvidenciasAtividade,
      };
    },
    rawData,
    { entityName: 'AtividadeExecucao', actionType: 'read' }
  );
