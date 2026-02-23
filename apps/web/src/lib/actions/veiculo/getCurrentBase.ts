'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const getVeiculoCurrentBaseSchema = z.object({
  veiculoId: z.number().int().positive(),
});

export const getVeiculoCurrentBase = async (veiculoId: number) =>
  handleServerAction(
    getVeiculoCurrentBaseSchema,
    async (data) => {
      const currentBase = await prisma.veiculoBaseHistorico.findFirst({
        where: {
          veiculoId: data.veiculoId,
          dataFim: null, // Base ativa (sem data de fim)
        },
        include: {
          base: true,
        },
      });

      return currentBase?.base ?? null;
    },
    { veiculoId },
    { entityName: 'VeiculoBaseHistorico', actionType: 'get' }
  );
