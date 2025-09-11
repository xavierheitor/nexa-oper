import { ChecklistOpcaoResposta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { ChecklistOpcaoRespostaRepository } from '../repositories/ChecklistOpcaoRespostaRepository';
import {
  checklistOpcaoRespostaCreateSchema,
  checklistOpcaoRespostaFilterSchema,
  checklistOpcaoRespostaUpdateSchema,
} from '../schemas/checklistOpcaoRespostaSchema';
import { PaginatedResult } from '../types/common';

type Create = z.infer<typeof checklistOpcaoRespostaCreateSchema>;
type Update = z.infer<typeof checklistOpcaoRespostaUpdateSchema>;
type Filter = z.infer<typeof checklistOpcaoRespostaFilterSchema>;

export class ChecklistOpcaoRespostaService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  ChecklistOpcaoResposta
> {
  private repoConcrete: ChecklistOpcaoRespostaRepository;

  constructor() {
    const repo = new ChecklistOpcaoRespostaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: Create, userId: string): Promise<ChecklistOpcaoResposta> {
    return this.repoConcrete.create(
      { nome: data.nome, geraPendencia: data.geraPendencia ?? false },
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ChecklistOpcaoResposta> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, { ...rest }, userId);
  }

  async delete(id: number, userId: string): Promise<ChecklistOpcaoResposta> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<ChecklistOpcaoResposta | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistOpcaoResposta>> {
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

