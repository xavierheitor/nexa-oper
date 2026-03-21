import { ProjMotivoOcorrencia } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjMotivoOcorrenciaRepository } from '../../repositories/projetos/ProjMotivoOcorrenciaRepository';
import {
  projMotivoOcorrenciaCreateSchema,
  projMotivoOcorrenciaFilterSchema,
  projMotivoOcorrenciaUpdateSchema,
} from '../../schemas/projMotivoOcorrenciaSchema';

type Create = z.infer<typeof projMotivoOcorrenciaCreateSchema>;
type Update = z.infer<typeof projMotivoOcorrenciaUpdateSchema>;
type Filter = z.infer<typeof projMotivoOcorrenciaFilterSchema>;

export class ProjMotivoOcorrenciaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ProjMotivoOcorrencia,
  ProjMotivoOcorrenciaRepository
> {
  constructor() {
    const repo = new ProjMotivoOcorrenciaRepository();
    super(repo);
  }

  async create(data: Create, userId: string): Promise<ProjMotivoOcorrencia> {
    return this.repo.create(
      {
        codigo: data.codigo,
        descricao: data.descricao,
        tipo: data.tipo,
        ativo: data.ativo ?? true,
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ProjMotivoOcorrencia> {
    const { id, ...rest } = data;
    return this.repo.update(
      id,
      {
        codigo: rest.codigo,
        descricao: rest.descricao,
        tipo: rest.tipo,
        ativo: rest.ativo ?? true,
      },
      userId
    );
  }
}
