'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const setMobileContratoPermissaoSchema = z.object({
  mobileUserId: z.number().int().positive(),
  contratoId: z.number().int().positive(),
});

export const setMobileContratoPermissao = async (rawData: unknown) =>
  handleServerAction(
    setMobileContratoPermissaoSchema,
    async (data, session) => {
      const existing = await prisma.mobileContratoPermissao.findFirst({
        where: {
          mobileUserId: data.mobileUserId,
          contratoId: data.contratoId,
          deletedAt: null,
        },
      });

      if (existing) {
        throw new Error('Vínculo já existe');
      }

      return prisma.mobileContratoPermissao.create({
        data: {
          mobileUserId: data.mobileUserId,
          contratoId: data.contratoId,
          createdBy: session.user.id,
          createdAt: new Date(),
        },
        include: {
          contrato: true,
          mobileUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      });
    },
    rawData,
    { entityName: 'MobileContratoPermissao', actionType: 'create' }
  );
