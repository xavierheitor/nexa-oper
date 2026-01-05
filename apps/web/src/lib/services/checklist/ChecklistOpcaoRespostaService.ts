import { ChecklistOpcaoResposta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistOpcaoRespostaRepository } from '../../repositories/checklist/ChecklistOpcaoRespostaRepository';
import {
  checklistOpcaoRespostaCreateSchema,
  checklistOpcaoRespostaFilterSchema,
  checklistOpcaoRespostaUpdateSchema,
} from '../../schemas/checklistOpcaoRespostaSchema';

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
      { nome: data.nome, geraPendencia: data.geraPendencia ?? false } as any,
      userId
    );
  }

  async update(data: Update, userId: string): Promise<ChecklistOpcaoResposta> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, { ...rest } as any, userId);
  }

  // delete, getById, list vêm da classe abstrata
}
