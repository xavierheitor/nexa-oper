import { ChecklistPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistPerguntaRepository } from '../../repositories/checklist/ChecklistPerguntaRepository';
import {
  checklistPerguntaCreateSchema,
  checklistPerguntaFilterSchema,
  checklistPerguntaUpdateSchema,
} from '../../schemas/checklistPerguntaSchema';
import { PaginatedResult } from '../../types/common';

type Create = z.infer<typeof checklistPerguntaCreateSchema>;
type Update = z.infer<typeof checklistPerguntaUpdateSchema>;
type Filter = z.infer<typeof checklistPerguntaFilterSchema>;

export class ChecklistPerguntaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ChecklistPergunta
> {
  private repoConcrete: ChecklistPerguntaRepository;

  constructor() {
    const repo = new ChecklistPerguntaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: Create, userId: string): Promise<ChecklistPergunta> {
    return this.repoConcrete.create({ nome: data.nome } as any, userId);
  }

  async update(data: Update, userId: string): Promise<ChecklistPergunta> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, { ...rest }, userId);
  }

  async delete(id: number, userId: string): Promise<ChecklistPergunta> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<ChecklistPergunta | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistPergunta>> {
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

