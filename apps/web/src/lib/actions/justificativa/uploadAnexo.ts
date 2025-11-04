/**
 * Server Action para fazer upload de anexo de justificativa
 *
 * Salva o arquivo no servidor Next.js e cria o registro no banco via Prisma
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { z } from 'zod';
import { uploadFile } from '@/lib/utils/fileUpload';
import { prisma } from '@/lib/db/db.service';

const uploadAnexoSchema = z.object({
  justificativaId: z.number().int().positive(),
  file: z.instanceof(File),
});

/**
 * Faz upload de um anexo para uma justificativa
 */
export const uploadAnexoJustificativa = async (rawData: unknown) =>
  handleServerAction(
    uploadAnexoSchema,
    async (data, session) => {
      // 1. Fazer upload do arquivo
      const uploadResult = await uploadFile(data.file, data.justificativaId);

      // 2. Criar registro no banco
      const anexo = await prisma.justificativaAnexo.create({
        data: {
          justificativaId: data.justificativaId,
          filePath: uploadResult.filePath,
          mimeType: uploadResult.mimeType,
          uploadedBy: session.user.id,
        },
      });

      return {
        id: anexo.id,
        filePath: uploadResult.filePath,
        url: uploadResult.url,
        mimeType: uploadResult.mimeType,
      };
    },
    rawData,
    { entityName: 'JustificativaAnexo', actionType: 'create' }
  );

