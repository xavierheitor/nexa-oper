/**
 * Server Action para Publicar Escalas em Lote
 *
 * Publica múltiplas escalas de uma vez, útil para ativar
 * várias escalas simultaneamente.
 */

'use server';

import { prisma } from '@/lib/db/db.service';
import { z } from 'zod';
import { handleServerAction } from '../common/actionHandler';
import { container } from '@/lib/services/common/registerServices';
import { EscalaEquipePeriodoService } from '@/lib/services/escala/EscalaEquipePeriodoService';

const publicarEmLoteSchema = z.object({
  escalasIds: z.array(z.number().int().positive()),
  validarComposicao: z.boolean().optional().default(false),
});

export const publicarEscalasEmLote = async (rawData: unknown) =>
  handleServerAction(
    publicarEmLoteSchema,
    async (data, session) => {
      const service = container.get<EscalaEquipePeriodoService>('escalaEquipePeriodoService');

      const resultados = {
        sucesso: 0,
        falhas: 0,
        erros: [] as Array<{ id: number; erro: string }>,
      };

      // Publica cada escala
      for (const escalaId of data.escalasIds) {
        try {
          await service.publicar(
            {
              escalaEquipePeriodoId: escalaId,
              validarComposicao: data.validarComposicao,
            },
            session.user.id
          );
          resultados.sucesso++;
        } catch (error) {
          resultados.falhas++;
          resultados.erros.push({
            id: escalaId,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
          });
        }
      }

      return resultados;
    },
    rawData,
    { entityName: 'EscalaEquipePeriodo', actionType: 'update' }
  );

