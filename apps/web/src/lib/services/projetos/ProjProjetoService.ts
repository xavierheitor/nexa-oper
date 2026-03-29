import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  ProjProjetoListItem,
  ProjProjetoRepository,
} from '../../repositories/projetos/ProjProjetoRepository';
import {
  projProjetoCreateSchema,
  projProjetoFilterSchema,
  projProjetoUpdateSchema,
} from '../../schemas/projProjetoSchema';

type Create = z.infer<typeof projProjetoCreateSchema>;
type Update = z.infer<typeof projProjetoUpdateSchema>;
type Filter = z.infer<typeof projProjetoFilterSchema>;

export class ProjProjetoService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjProjetoListItem,
  ProjProjetoRepository
> {
  constructor() {
    super(new ProjProjetoRepository());
  }

  async create(data: Create, userId: string): Promise<ProjProjetoListItem> {
    return this.repo.create(
      {
        numeroProjeto: data.numeroProjeto,
        descricao: data.descricao,
        equipamento: data.equipamento,
        municipio: data.municipio,
        status: data.status,
        createdBy: userId,
        programa: {
          connect: {
            id: data.programaId,
          },
        },
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjProjetoListItem> {
    const { id, programaId, ...rest } = data;

    return this.repo.update(
      id,
      {
        ...rest,
        updatedBy: userId,
        programa: {
          connect: {
            id: programaId,
          },
        },
      },
      userId
    );
  }
}
