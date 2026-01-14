'use server';

import { z } from 'zod';
import { prisma } from '@/lib/db/db.service';
import { handleServerAction } from '../common/actionHandler';

const substituirEletricistaSchema = z.object({
  escalaId: z.coerce.number(),
  eletricistaSaiId: z.coerce.number(),
  eletricistaEntraId: z.coerce.number(),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date(),
});

export const substituirEletricistaAction = async (rawData: unknown) => {
  return handleServerAction(
    substituirEletricistaSchema,
    async (data, session) => {
      // 1. Verificar conflito básico (opcional): O substituto já está nessa mesma escala nesse período?
      // Isso pode ser complexo pois ele pode estar em OUTRA equipe.
      // Vamos apenas logar ou confiar no gestor.

      // 2. Executar a substituição
      // Atualiza slots que pertencem ao eletricista que sai, dentro do periodo e da escala
      const result = await prisma.slotEscala.updateMany({
        where: {
          escalaEquipePeriodoId: data.escalaId,
          eletricistaId: data.eletricistaSaiId,
          data: {
            gte: data.dataInicio,
            lte: data.dataFim,
          },
        },
        data: {
          eletricistaId: data.eletricistaEntraId, // Novo dono do slot
          updatedBy: session.user.id,
          updatedAt: new Date(),
        },
      });

      return {
        count: result.count,
        message: `${result.count} dia(s) substituído(s) com sucesso.`,
      };
    },
    rawData,
    { entityName: 'SlotEscala', actionType: 'update' }
  );
};
