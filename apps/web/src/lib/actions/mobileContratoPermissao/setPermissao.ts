'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';

const setMobileContratoPermissaoSchema = z.object({
  mobileUserId: z.number().int().positive(),
  contratoId: z.number().int().positive(),
});

export async function setMobileContratoPermissao(rawData: any) {
  try {
    const data = setMobileContratoPermissaoSchema.parse(rawData);

    // Verifica se já existe o vínculo
    const existing = await prisma.mobileContratoPermissao.findFirst({
      where: {
        mobileUserId: data.mobileUserId,
        contratoId: data.contratoId,
        deletedAt: null,
      },
    });

    if (existing) {
      return { success: false, error: 'Vínculo já existe' };
    }

    // Cria o vínculo
    const result = await prisma.mobileContratoPermissao.create({
      data: {
        mobileUserId: data.mobileUserId,
        contratoId: data.contratoId,
        createdBy: 'web-admin',
        createdAt: new Date(),
      },
      include: {
        contrato: true,
        mobileUser: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    };
  }
}
