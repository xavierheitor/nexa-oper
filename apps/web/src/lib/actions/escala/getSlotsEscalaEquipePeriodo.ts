'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';

const slotsEscalaEquipeSchema = z.object({
  equipeId: z.number().int().positive(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

export const getSlotsEscalaEquipePeriodo = async (rawData: unknown) =>
  handleServerAction(
    slotsEscalaEquipeSchema,
    async (data) => {
      const slots = await prisma.slotEscala.findMany({
        where: {
          deletedAt: null,
          estado: 'TRABALHO',
          data: {
            gte: data.dataInicio,
            lte: data.dataFim,
          },
          escalaEquipePeriodo: {
            equipeId: data.equipeId,
            status: 'PUBLICADA',
            deletedAt: null,
          },
        },
        select: {
          id: true,
          data: true,
          inicioPrevisto: true,
          fimPrevisto: true,
          eletricistaId: true,
          eletricista: {
            select: {
              id: true,
              nome: true,
              matricula: true,
            },
          },
        },
        orderBy: {
          data: 'asc',
        },
      });

      return slots;
    },
    rawData,
    { entityName: 'SlotEscala', actionType: 'read' }
  );
