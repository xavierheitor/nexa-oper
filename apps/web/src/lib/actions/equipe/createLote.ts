/**
 * Server Action para criar equipes em lote
 */

'use server';

import { handleServerAction } from '../common/actionHandler';
import { equipeLoteSchema } from '@/lib/schemas/equipeSchema';
import { prisma } from '@/lib/db/db.service';

export const createEquipesLote = async (rawData: unknown) =>
  handleServerAction(
    equipeLoteSchema,
    async (data, session) => {
      // Criar todas as equipes em uma transação
      const equipesCriadas = await prisma.$transaction(async (tx) => {
        const resultados = [];

        for (const equipeData of data.equipes) {
          const equipe = await tx.equipe.create({
            data: {
              nome: equipeData.nome,
              tipoEquipe: { connect: { id: data.tipoEquipeId } },
              contrato: { connect: { id: data.contratoId } },
              createdAt: new Date(),
              createdBy: session.user.id,
            },
          });

          resultados.push(equipe);
        }

        return resultados;
      });

      return {
        equipesCriadas: equipesCriadas.length,
        equipes: equipesCriadas,
      };
    },
    rawData,
    { entityName: 'Equipe', actionType: 'create' }
  );

