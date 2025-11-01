import { TipoChecklist } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { TipoChecklistRepository } from '../repositories/TipoChecklistRepository';
import {
  tipoChecklistCreateSchema,
  tipoChecklistFilterSchema,
  tipoChecklistUpdateSchema,
} from '../schemas/tipoChecklistSchema';
import { PaginatedResult } from '../types/common';

type Create = z.infer<typeof tipoChecklistCreateSchema>;
type Update = z.infer<typeof tipoChecklistUpdateSchema>;
type Filter = z.infer<typeof tipoChecklistFilterSchema>;

export class TipoChecklistService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  TipoChecklist
> {
  private repoConcrete: TipoChecklistRepository;

  constructor() {
    const repo = new TipoChecklistRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: Create, userId: string): Promise<TipoChecklist> {
    return this.repoConcrete.create({ nome: data.nome, createdBy: userId }, userId);
  }

  async update(data: Update, userId: string): Promise<TipoChecklist> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, rest, userId);
  }

  async delete(id: number, userId: string): Promise<TipoChecklist> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<TipoChecklist | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<TipoChecklist>> {
    const { items, total } = await this.repoConcrete.list(params as any);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
