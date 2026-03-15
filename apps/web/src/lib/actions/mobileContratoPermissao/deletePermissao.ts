'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { requireManageMobileUserPermissions } from '../common/permissionGuard';

const deletePermissaoSchema = z.object({
  id: z.number().int().positive(),
});

export const deleteMobileContratoPermissao = async (rawData: unknown) =>
  handleServerAction(
    deletePermissaoSchema,
    async (data, session) => {
      requireManageMobileUserPermissions(session);

      return prisma.mobileContratoPermissao.update({
        where: { id: data.id },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      });
    },
    rawData,
    { entityName: 'MobileContratoPermissao', actionType: 'delete' }
  );
