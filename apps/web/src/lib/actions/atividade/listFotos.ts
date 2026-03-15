'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '@/lib/actions/common/actionHandler';
import { requireActivitiesPermission } from '@/lib/actions/common/permissionGuard';

const listAtividadeFotosSchema = z.object({
  turnoId: z.number().int().positive(),
});

type FotoTurnoRow = {
  id: string;
  origem: string;
  numeroDocumento: string | null;
  contexto: string | null;
  categoria: string | null;
  nomeArquivo: string | null;
  mimeType: string | null;
  url: string | null;
  path: string | null;
  createdAt: Date;
};

export const listAtividadeFotos = async (rawData: unknown) =>
  handleServerAction(
    listAtividadeFotosSchema,
    async (data, session) => {
      requireActivitiesPermission(session);
      const [fotosAtividade, evidenciasUpload] = await Promise.all([
        prisma.atividadeFoto.findMany({
          where: {
            deletedAt: null,
            atividadeExecucao: {
              turnoId: data.turnoId,
              deletedAt: null,
            },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contexto: true,
            fileName: true,
            mimeType: true,
            url: true,
            storagePath: true,
            createdAt: true,
            atividadeExecucao: {
              select: {
                numeroDocumento: true,
              },
            },
          },
        }),
        prisma.uploadEvidenceLink.findMany({
          where: {
            turnoId: data.turnoId,
            ownerType: {
              in: ['atividade', 'atividadeMedidor', 'apr'],
            },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            ownerType: true,
            photoCategory: true,
            atividadeContexto: true,
            uploadEvidence: {
              select: {
                id: true,
                url: true,
                path: true,
                nomeArquivo: true,
                mimeType: true,
                createdAt: true,
              },
            },
          },
        }),
      ]);

      const rows: FotoTurnoRow[] = [];
      const seen = new Set<string>();

      const pushUnique = (row: FotoTurnoRow) => {
        const key = `${row.url || ''}|${row.path || ''}|${row.nomeArquivo || ''}`;
        if (seen.has(key)) return;
        seen.add(key);
        rows.push(row);
      };

      fotosAtividade.forEach(foto => {
        pushUnique({
          id: `atividade-${foto.id}`,
          origem: 'Atividade',
          numeroDocumento: foto.atividadeExecucao?.numeroDocumento ?? null,
          contexto: foto.contexto ?? null,
          categoria: null,
          nomeArquivo: foto.fileName ?? null,
          mimeType: foto.mimeType ?? null,
          url: foto.url ?? null,
          path: foto.storagePath ?? null,
          createdAt: foto.createdAt,
        });
      });

      evidenciasUpload.forEach(link => {
        if (!link.uploadEvidence) return;
        pushUnique({
          id: `upload-${link.uploadEvidence.id}-${link.id}`,
          origem: 'Upload',
          numeroDocumento: null,
          contexto: link.atividadeContexto ?? null,
          categoria: link.photoCategory ?? null,
          nomeArquivo: link.uploadEvidence.nomeArquivo ?? null,
          mimeType: link.uploadEvidence.mimeType ?? null,
          url: link.uploadEvidence.url ?? null,
          path: link.uploadEvidence.path ?? null,
          createdAt: link.uploadEvidence.createdAt,
        });
      });

      rows.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        data: rows,
        total: rows.length,
        page: 1,
        pageSize: rows.length || 1,
        totalPages: 1,
      };
    },
    rawData,
    { entityName: 'AtividadeFoto', actionType: 'list' }
  );
