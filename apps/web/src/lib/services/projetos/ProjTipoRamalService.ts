import { ProjTipoRamal } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjTipoRamalRepository } from '../../repositories/projetos/ProjTipoRamalRepository';
import {
  projTipoRamalCreateSchema,
  projTipoRamalFilterSchema,
  projTipoRamalUpdateSchema,
} from '../../schemas/projTipoRamalSchema';

type Create = z.infer<typeof projTipoRamalCreateSchema>;
type Update = z.infer<typeof projTipoRamalUpdateSchema>;
type Filter = z.infer<typeof projTipoRamalFilterSchema>;

export class ProjTipoRamalService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjTipoRamal,
  ProjTipoRamalRepository
> {
  constructor() {
    const repo = new ProjTipoRamalRepository();
    super(repo);
  }

  async create(data: Create, userId: string): Promise<ProjTipoRamal> {
    return this.repo.create(
      {
        nome: data.nome,
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjTipoRamal> {
    const { id, ...rest } = data;
    return this.repo.update(id, rest, userId);
  }
}
