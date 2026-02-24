'use server';

import { prisma } from '@/lib/db/db.service';
import { materialCatalogoLoteSchema } from '@/lib/schemas/materialCatalogoSchema';
import { handleServerAction } from '../common/actionHandler';

export const createMateriaisCatalogoLote = async (rawData: unknown) =>
  handleServerAction(
    materialCatalogoLoteSchema,
    async (data, session) => {
      const materiaisCriados = await prisma.$transaction(async (tx) => {
        const resultados = [];

        for (const materialData of data.materiais) {
          const material = await tx.materialCatalogo.create({
            data: {
              codigo: materialData.codigo,
              descricao: materialData.descricao,
              unidadeMedida: materialData.unidadeMedida,
              ativo: materialData.ativo ?? true,
              contrato: { connect: { id: data.contratoId } },
              createdAt: new Date(),
              createdBy: session.user.id,
            },
          });

          resultados.push(material);
        }

        return resultados;
      });

      return {
        materiaisCriados: materiaisCriados.length,
        materiais: materiaisCriados,
      };
    },
    rawData,
    { entityName: 'MaterialCatalogo', actionType: 'create' }
  );
