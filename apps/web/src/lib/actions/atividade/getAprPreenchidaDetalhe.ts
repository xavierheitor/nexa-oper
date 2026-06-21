'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { requireActivitiesPermission } from '@/lib/actions/common/permissionGuard';

const getAprPreenchidaDetalheSchema = z.object({
  id: z.number().int().positive(),
});

export const getAprPreenchidaDetalhe = async (rawData: unknown) =>
  handleServerAction(
    getAprPreenchidaDetalheSchema,
    async (data, session) => {
      requireActivitiesPermission(session);

      const apr = await prisma.atividadeAprPreenchida.findFirst({
        where: {
          id: data.id,
          deletedAt: null,
        },
        include: {
          apr: {
            select: {
              id: true,
              nome: true,
            },
          },
          atividadeExecucao: {
            select: {
              id: true,
              numeroDocumento: true,
            },
          },
          respostas: {
            include: {
              AtividadeAprRespostaMedidaControle: {
                orderBy: { id: 'asc' },
                select: {
                  id: true,
                  aprMedidaControleId: true,
                  medidaControleNomeSnapshot: true,
                  textoLivre: true,
                },
              },
            },
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
      });

      if (!apr) {
        throw new Error('APR preenchida não encontrada');
      }

      const [uploadLinksApr, uploadEvidenciasAprLegado] = await Promise.all([
        prisma.uploadEvidenceLink.findMany({
          where: {
            ownerType: 'apr',
            OR: [
              { ownerRef: apr.aprUuid },
              { ownerRef: String(apr.id) },
              { aprUuid: apr.aprUuid },
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
        prisma.uploadEvidence.findMany({
          where: {
            tipo: 'apr-evidence',
            entityId: String(apr.id),
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
      ]);

      const evidenciasUpload = [
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
        (item, index, list) => list.findIndex(it => it.id === item.id) === index,
      );

      return {
        ...apr,
        evidenciasUpload,
      };
    },
    rawData,
    { entityName: 'AtividadeAprPreenchida', actionType: 'read' },
  );
