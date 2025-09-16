'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';

const deletePermissaoSchema = z.object({
  id: z.number().int().positive(),
});

export async function deleteMobileContratoPermissao(rawData: any) {
  try {
    const data = deletePermissaoSchema.parse(rawData);

    const result = await prisma.mobileContratoPermissao.update({
      where: { id: data.id },
      data: {
        deletedAt: new Date(),
        deletedBy: 'web-admin',
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao remover permissão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    };
  }
}
