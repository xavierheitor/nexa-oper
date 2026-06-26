import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  ProjProgramaListItem,
  ProjProgramaRepository,
} from '../../repositories/projetos/ProjProgramaRepository';
import {
  projProgramaCreateSchema,
  projProgramaFilterSchema,
  projProgramaUpdateSchema,
} from '../../schemas/projProgramaSchema';

type Create = z.infer<typeof projProgramaCreateSchema>;
type Update = z.infer<typeof projProgramaUpdateSchema>;
type Filter = z.infer<typeof projProgramaFilterSchema>;

export class ProjProgramaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjProgramaListItem,
  ProjProgramaRepository
> {
  constructor() {
    super(new ProjProgramaRepository());
  }

  async create(data: Create, userId: string): Promise<ProjProgramaListItem> {
    return this.repo.create(
      {
        nome: data.nome,
        createdBy: userId,
        contrato: {
          connect: {
            id: data.contratoId,
          },
        },
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjProgramaListItem> {
    const { id, contratoId, nome } = data;

    return this.repo.update(
      id,
      {
        nome,
        updatedBy: userId,
        contrato: {
          connect: {
            id: contratoId,
          },
        },
      },
      userId
    );
  }
}
