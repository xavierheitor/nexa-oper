import { ChecklistPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistPerguntaRepository } from '../../repositories/checklist/ChecklistPerguntaRepository';
import {
  checklistPerguntaCreateSchema,
  checklistPerguntaFilterSchema,
  checklistPerguntaUpdateSchema,
} from '../../schemas/checklistPerguntaSchema';

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
    return this.repoConcrete.update(id, { ...rest } as any, userId);
  }

  // delete, getById, list vêm da classe abstrata
}
