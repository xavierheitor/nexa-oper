import { TipoAtividade } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { TipoAtividadeRepository } from '../repositories/catalogo/TipoAtividadeRepository';
import {
  tipoAtividadeCreateSchema,
  tipoAtividadeFilterSchema,
  tipoAtividadeUpdateSchema,
} from '../schemas/tipoAtividadeSchema';
import { PaginatedResult } from '../types/common';

type Create = z.infer<typeof tipoAtividadeCreateSchema>;
type Update = z.infer<typeof tipoAtividadeUpdateSchema>;
type Filter = z.infer<typeof tipoAtividadeFilterSchema>;

export class TipoAtividadeService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  TipoAtividade
> {
  private repoConcrete: TipoAtividadeRepository;
  constructor() {
    const repo = new TipoAtividadeRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: Create, userId: string): Promise<TipoAtividade> {
    return this.repoConcrete.create({ nome: data.nome, createdBy: userId }, userId);
  }

  async update(data: Update, userId: string): Promise<TipoAtividade> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, rest, userId);
  }

  async delete(id: number, userId: string): Promise<TipoAtividade> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<TipoAtividade | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<TipoAtividade>> {
    const { items, total } = await this.repoConcrete.list(params);
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

