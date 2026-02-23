'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const deletePermissaoSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteMobileContratoPermissao = async (rawData: unknown) =>
  handleServerAction(
    deletePermissaoSchema,
    async (data, session) =>
      prisma.mobileContratoPermissao.update({
        where: { id: data.id },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      }),
    rawData,
    { entityName: 'MobileContratoPermissao', actionType: 'delete' }
  );
