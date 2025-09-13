import { ChecklistTipoVeiculoRelacao } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { ChecklistTipoVeiculoRelacaoRepository } from '../repositories/ChecklistTipoVeiculoRelacaoRepository';
import { PaginatedResult } from '../types/common';

export const setChecklistTipoVeiculoSchema = z.object({
  tipoVeiculoId: z.number().int(),
  checklistId: z.number().int(),
});

type Filter = { page: number; pageSize: number; orderBy: string; orderDir: 'asc' | 'desc'; include?: any };

export class ChecklistTipoVeiculoVinculoService extends AbstractCrudService<
  z.infer<typeof setChecklistTipoVeiculoSchema>,
  any,
  Filter,
  ChecklistTipoVeiculoRelacao
> {
  private repo: ChecklistTipoVeiculoRelacaoRepository;
  constructor() {
    const repo = new ChecklistTipoVeiculoRelacaoRepository();
    super(repo);
    this.repo = repo;
  }

  async setMapping(data: z.infer<typeof setChecklistTipoVeiculoSchema>, userId: string) {
    return this.repo.setActiveMapping(data.tipoVeiculoId, data.checklistId, userId);
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistTipoVeiculoRelacao>> {
    const { items, total } = await this.repo.list(params as any);
    return { data: items, total, totalPages: Math.ceil(total / params.pageSize), page: params.page, pageSize: params.pageSize };
  }

  protected getSearchFields(): string[] { return []; }
}

