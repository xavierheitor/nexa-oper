import { ChecklistPendencia } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { ChecklistPendenciaRepository } from '../repositories/ChecklistPendenciaRepository';
import {
  checklistPendenciaFilterSchema,
  checklistPendenciaUpdateSchema,
} from '../schemas/checklistPendenciaSchema';
import { PaginatedResult } from '../types/common';

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

  async create(data: never, userId: string): Promise<ChecklistPendencia> {
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
    return this.repoConcrete.update(id, updateData, userId);
  }

  async delete(id: number, userId: string): Promise<ChecklistPendencia> {
    return this.repoConcrete.delete(id, userId);
  }

  async getById(id: number): Promise<ChecklistPendencia | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistPendencia>> {
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
    return ['observacaoProblema', 'observacaoTratamento'];
  }
}


