import { AprMedidaControle } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AprMedidaControleRepository } from '../../repositories/apr/AprMedidaControleRepository';
import {
  aprMedidaControleCreateSchema,
  aprMedidaControleFilterSchema,
  aprMedidaControleUpdateSchema,
} from '../../schemas/aprMedidaControleSchema';

type AprMedidaControleCreate = z.infer<typeof aprMedidaControleCreateSchema>;
type AprMedidaControleUpdate = z.infer<typeof aprMedidaControleUpdateSchema>;
type AprMedidaControleFilter = z.infer<typeof aprMedidaControleFilterSchema>;

export class AprMedidaControleService extends AbstractCrudService<
  AprMedidaControleCreate,
  AprMedidaControleUpdate,
  AprMedidaControleFilter,
  AprMedidaControle
> {
  private repoConcrete: AprMedidaControleRepository;

  constructor() {
    const repo = new AprMedidaControleRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: any, userId: string): Promise<AprMedidaControle> {
    const { createdBy, createdAt, ...businessData } = data;

    return this.repoConcrete.create(
      {
        ...businessData,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      },
      userId
    );
  }

  async update(
    data: AprMedidaControleUpdate,
    userId: string
  ): Promise<AprMedidaControle> {
    const { id, ...updateData } = data;
    return this.repoConcrete.update(id, updateData, userId);
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
