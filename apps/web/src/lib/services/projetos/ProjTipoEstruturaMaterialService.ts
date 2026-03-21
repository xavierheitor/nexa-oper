import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  ProjTipoEstruturaMaterialRepository,
  ProjTipoEstruturaMaterialRow,
} from '../../repositories/projetos/ProjTipoEstruturaMaterialRepository';
import {
  projTipoEstruturaMaterialCreateSchema,
  projTipoEstruturaMaterialCreateBatchSchema,
  projTipoEstruturaMaterialFilterSchema,
  projTipoEstruturaMaterialUpdateSchema,
} from '../../schemas/projTipoEstruturaMaterialSchema';

type Create = z.infer<typeof projTipoEstruturaMaterialCreateSchema>;
type CreateBatch = z.infer<typeof projTipoEstruturaMaterialCreateBatchSchema>;
type Update = z.infer<typeof projTipoEstruturaMaterialUpdateSchema>;
type Filter = z.infer<typeof projTipoEstruturaMaterialFilterSchema>;

export class ProjTipoEstruturaMaterialService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjTipoEstruturaMaterialRow,
  ProjTipoEstruturaMaterialRepository
> {
  constructor() {
    const repo = new ProjTipoEstruturaMaterialRepository();
    super(repo);
  }

  async create(data: Create, userId: string): Promise<ProjTipoEstruturaMaterialRow> {
    return this.repo.create(
      {
        quantidadeBase: data.quantidadeBase,
        tipoConsumo: data.tipoConsumo,
        tipoEstrutura: { connect: { id: data.tipoEstruturaId } },
        material: { connect: { id: data.materialId } },
        createdBy: userId,
      },
      userId
    );
  }

  async createMany(
    data: CreateBatch,
    userId: string
  ): Promise<ProjTipoEstruturaMaterialRow[]> {
    return this.repo.createMany(
      data.itens.map((item) => ({
        quantidadeBase: item.quantidadeBase,
        tipoConsumo: item.tipoConsumo,
        tipoEstrutura: { connect: { id: data.tipoEstruturaId } },
        material: { connect: { id: item.materialId } },
        createdBy: userId,
      })),
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjTipoEstruturaMaterialRow> {
    const { id, ...rest } = data;
    return this.repo.update(
      id,
      {
        quantidadeBase: rest.quantidadeBase,
        tipoConsumo: rest.tipoConsumo,
        tipoEstrutura: { connect: { id: rest.tipoEstruturaId } },
        material: { connect: { id: rest.materialId } },
      },
      userId
    );
  }
}
