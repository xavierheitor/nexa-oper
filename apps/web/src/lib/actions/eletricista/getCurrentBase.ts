'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';

const getEletricistaCurrentBaseSchema = z.object({
  eletricistaId: z.number().int().positive(),
});

export const getEletricistaCurrentBase = async (eletricistaId: number) =>
  handleServerAction(
    getEletricistaCurrentBaseSchema,
    async (data) => {
      const currentBase = await prisma.eletricistaBaseHistorico.findFirst({
        where: {
          eletricistaId: data.eletricistaId,
          dataFim: null, // Base ativa (sem data de fim)
        },
        include: {
          base: true,
        },
      });

      return currentBase?.base ?? null;
    },
    { eletricistaId },
    { entityName: 'EletricistaBaseHistorico', actionType: 'get' }
  );
