import { ChecklistPendencia } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistPendenciaRepository } from '../../repositories/checklist/ChecklistPendenciaRepository';
import {
  checklistPendenciaFilterSchema,
  checklistPendenciaUpdateSchema,
} from '../../schemas/checklistPendenciaSchema';

type Update = z.infer<typeof checklistPendenciaUpdateSchema>;
type Filter = z.infer<typeof checklistPendenciaFilterSchema>;

export class ChecklistPendenciaService extends AbstractCrudService<
  never, // Não permite criação direta
  Update,
  Filter,
  ChecklistPendencia
> {
  private repoConcrete: ChecklistPendenciaRepository;

  constructor() {
    const repo = new ChecklistPendenciaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(_data: never, _userId: string): Promise<ChecklistPendencia> {
    throw new Error('ChecklistPendencia não pode ser criada diretamente. Use o serviço de checklist preenchido.');
  }

  async update(data: Update, userId: string): Promise<ChecklistPendencia> {
    const { id, tratadoEm, ...rest } = data;
    // Converte tratadoEm de string para Date se necessário
    const updateData: Partial<{
      status: 'AGUARDANDO_TRATAMENTO' | 'EM_TRATAMENTO' | 'TRATADA' | 'REGISTRO_INCORRETO';
      observacaoTratamento?: string;
      tratadoPor?: string;
      tratadoEm?: Date;
    }> = {
      ...rest,
      ...(tratadoEm && {
        tratadoEm: tratadoEm instanceof Date ? tratadoEm : new Date(tratadoEm),
      }),
    };
    return this.repoConcrete.update(id, updateData as any, userId);
  }

  // delete, getById, list vêm da classe abstrata
}
