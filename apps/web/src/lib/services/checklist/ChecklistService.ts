import { Checklist } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistRepository } from '../../repositories/checklist/ChecklistRepository';
import {
  checklistCreateSchema,
  checklistFilterSchema,
  checklistUpdateSchema,
} from '../../schemas/checklistSchema';
import { PaginatedResult } from '../../types/common';

type Create = z.infer<typeof checklistCreateSchema>;
type Update = z.infer<typeof checklistUpdateSchema>;
type Filter = z.infer<typeof checklistFilterSchema>;

export class ChecklistService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  Checklist
> {
  private repoConcrete: ChecklistRepository;

  constructor() {
    const repo = new ChecklistRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: Create, userId: string): Promise<Checklist> {
    const { perguntaIds = [], opcaoRespostaIds = [], ...rest } = data;
    const checklist = await this.repoConcrete.create(rest, userId);
    if (perguntaIds.length) await this.repoConcrete.setPerguntas(checklist.id, perguntaIds, userId);
    if (opcaoRespostaIds.length) await this.repoConcrete.setOpcoes(checklist.id, opcaoRespostaIds, userId);
    return checklist;
  }

  async update(data: Update, userId: string): Promise<Checklist> {
    const { id, perguntaIds = [], opcaoRespostaIds = [], ...rest } = data;
    const checklist = await this.repoConcrete.update(id, rest, userId);
    await this.repoConcrete.setPerguntas(id, perguntaIds, userId);
    await this.repoConcrete.setOpcoes(id, opcaoRespostaIds, userId);
    return checklist;
  }

  async delete(id: number, userId: string): Promise<Checklist> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<Checklist | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<Checklist>> {
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

