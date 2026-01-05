import { TipoChecklist } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { TipoChecklistRepository } from '../../repositories/checklist/TipoChecklistRepository';
import {
  tipoChecklistCreateSchema,
  tipoChecklistFilterSchema,
  tipoChecklistUpdateSchema,
} from '../../schemas/tipoChecklistSchema';

type Create = z.infer<typeof tipoChecklistCreateSchema>;
type Update = z.infer<typeof tipoChecklistUpdateSchema>;
type Filter = z.infer<typeof tipoChecklistFilterSchema>;

export class TipoChecklistService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  TipoChecklist
> {
  constructor() {
    super(new TipoChecklistRepository());
  }

  async create(data: Create, userId: string): Promise<TipoChecklist> {
    // Cast necessário porque TipoChecklistRepository.create aceita userId como parâmetro opcional
    const repo = this.repo as any as { create(data: any, userId?: string): Promise<TipoChecklist> };
    return repo.create({ nome: data.nome } as any, userId);
  }

  async update(data: Update, userId: string): Promise<TipoChecklist> {
    const { id, ...rest } = data;
    // Cast necessário porque TipoChecklistRepository.update aceita userId como parâmetro opcional
    const repo = this.repo as any as { update(id: number, data: any, userId?: string): Promise<TipoChecklist> };
    return repo.update(id, rest as any, userId);
  }

  // delete, getById, list vêm da classe abstrata
}
