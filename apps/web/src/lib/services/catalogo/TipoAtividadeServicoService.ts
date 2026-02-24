import { TipoAtividadeServico } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { TipoAtividadeServicoRepository } from '../../repositories/catalogo/TipoAtividadeServicoRepository';
import {
  tipoAtividadeServicoCreateSchema,
  tipoAtividadeServicoFilterSchema,
  tipoAtividadeServicoUpdateSchema,
} from '../../schemas/tipoAtividadeServicoSchema';

type Create = z.infer<typeof tipoAtividadeServicoCreateSchema>;
type Update = z.infer<typeof tipoAtividadeServicoUpdateSchema>;
type Filter = z.infer<typeof tipoAtividadeServicoFilterSchema>;

export class TipoAtividadeServicoService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  TipoAtividadeServico,
  TipoAtividadeServicoRepository
> {
  private tipoAtividadeServicoRepo: TipoAtividadeServicoRepository;

  constructor() {
    const repo = new TipoAtividadeServicoRepository();
    super(repo);
    this.tipoAtividadeServicoRepo = repo;
  }

  async create(data: Create, userId: string): Promise<TipoAtividadeServico> {
    return this.tipoAtividadeServicoRepo.create(
      {
        nome: data.nome,
        atividadeTipo: { connect: { id: data.atividadeTipoId } },
        createdBy: userId,
      },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<TipoAtividadeServico> {
    const { id, ...rest } = data;
    return this.tipoAtividadeServicoRepo.update(
      id,
      {
        nome: rest.nome,
        atividadeTipo: { connect: { id: rest.atividadeTipoId } },
      },
      userId
    );
  }
}
