import { ProjEstrutura } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjTipoEstruturaRepository } from '../../repositories/projetos/ProjTipoEstruturaRepository';
import {
  projTipoEstruturaCreateSchema,
  projTipoEstruturaFilterSchema,
  projTipoEstruturaUpdateSchema,
} from '../../schemas/projTipoEstruturaSchema';

type ProjTipoEstruturaCreate = z.infer<typeof projTipoEstruturaCreateSchema>;
type ProjTipoEstruturaUpdate = z.infer<typeof projTipoEstruturaUpdateSchema>;
type ProjTipoEstruturaFilter = z.infer<typeof projTipoEstruturaFilterSchema>;

export class ProjTipoEstruturaService extends AbstractCrudService<
  ProjTipoEstruturaCreate,
  ProjTipoEstruturaUpdate,
  ProjTipoEstruturaFilter,
  ProjEstrutura,
  ProjTipoEstruturaRepository
> {
  constructor() {
    super(new ProjTipoEstruturaRepository());
  }

  async create(raw: unknown, userId: string): Promise<ProjEstrutura> {
    const data = projTipoEstruturaCreateSchema.parse(raw);

    return this.repo.create(
      {
        nome: data.nome,
        createdBy: userId,
      },
      userId
    );
  }

  async update(raw: unknown, userId: string): Promise<ProjEstrutura> {
    const data = projTipoEstruturaUpdateSchema.parse(raw);
    const { id, nome } = data;

    return this.repo.update(
      id,
      {
        nome,
        updatedBy: userId,
      },
      userId
    );
  }
}
