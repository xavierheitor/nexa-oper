import { CausaImprodutiva } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { CausaImprodutivaRepository } from '../../repositories/catalogo/CausaImprodutivaRepository';
import {
  causaImprodutivaCreateSchema,
  causaImprodutivaFilterSchema,
  causaImprodutivaUpdateSchema,
} from '../../schemas/causaImprodutivaSchema';

type Create = z.infer<typeof causaImprodutivaCreateSchema>;
type Update = z.infer<typeof causaImprodutivaUpdateSchema>;
type Filter = z.infer<typeof causaImprodutivaFilterSchema>;

export class CausaImprodutivaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  CausaImprodutiva,
  CausaImprodutivaRepository
> {
  private causaImprodutivaRepo: CausaImprodutivaRepository;

  constructor() {
    const repo = new CausaImprodutivaRepository();
    super(repo);
    this.causaImprodutivaRepo = repo;
  }

  async create(data: Create, userId: string): Promise<CausaImprodutiva> {
    return this.causaImprodutivaRepo.create(
      {
        causa: data.causa,
        ativo: data.ativo ?? true,
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<CausaImprodutiva> {
    const { id, ...rest } = data;
    return this.causaImprodutivaRepo.update(
      id,
      {
        causa: rest.causa,
        ativo: rest.ativo ?? true,
      },
      userId
    );
  }
}
