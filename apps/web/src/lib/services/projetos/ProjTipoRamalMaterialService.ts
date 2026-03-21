import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  ProjTipoRamalMaterialRepository,
  ProjTipoRamalMaterialRow,
} from '../../repositories/projetos/ProjTipoRamalMaterialRepository';
import {
  projTipoRamalMaterialCreateSchema,
  projTipoRamalMaterialFilterSchema,
  projTipoRamalMaterialUpdateSchema,
} from '../../schemas/projTipoRamalMaterialSchema';

type Create = z.infer<typeof projTipoRamalMaterialCreateSchema>;
type Update = z.infer<typeof projTipoRamalMaterialUpdateSchema>;
type Filter = z.infer<typeof projTipoRamalMaterialFilterSchema>;

export class ProjTipoRamalMaterialService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjTipoRamalMaterialRow,
  ProjTipoRamalMaterialRepository
> {
  constructor() {
    const repo = new ProjTipoRamalMaterialRepository();
    super(repo);
  }

  async create(data: Create, userId: string): Promise<ProjTipoRamalMaterialRow> {
    return this.repo.create(
      {
        quantidadeBase: data.quantidadeBase,
        tipoConsumo: data.tipoConsumo,
        contrato: { connect: { id: data.contratoId } },
        tipoRamal: { connect: { id: data.tipoRamalId } },
        material: { connect: { id: data.materialId } },
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjTipoRamalMaterialRow> {
    const { id, ...rest } = data;
    return this.repo.update(
      id,
      {
        quantidadeBase: rest.quantidadeBase,
        tipoConsumo: rest.tipoConsumo,
        contrato: { connect: { id: rest.contratoId } },
        tipoRamal: { connect: { id: rest.tipoRamalId } },
        material: { connect: { id: rest.materialId } },
      },
      userId
    );
  }
}
