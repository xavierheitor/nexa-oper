import { ChecklistTipoEquipeRelacao } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { ChecklistTipoEquipeRelacaoRepository } from '../repositories/ChecklistTipoEquipeRelacaoRepository';
import { PaginatedResult } from '../types/common';
import { prisma } from '../db/db.service';

export const setChecklistTipoEquipeSchema = z.object({
  tipoEquipeId: z.number().int(),
  checklistId: z.number().int(),
});

type Filter = { page: number; pageSize: number; orderBy: string; orderDir: 'asc' | 'desc'; include?: any };

export class ChecklistTipoEquipeVinculoService extends AbstractCrudService<
  z.infer<typeof setChecklistTipoEquipeSchema>,
  any,
  Filter,
  ChecklistTipoEquipeRelacao
> {
  private repo: ChecklistTipoEquipeRelacaoRepository;
  constructor() {
    const repo = new ChecklistTipoEquipeRelacaoRepository();
    super(repo);
    this.repo = repo;
  }

  async setMapping(data: z.infer<typeof setChecklistTipoEquipeSchema>, userId: string) {
    // Validação de regra de negócio: verificar se checklist existe
    const checklist = await prisma.checklist.findUnique({
      where: { id: data.checklistId },
      select: { id: true },
    });

    if (!checklist) {
      throw new Error('Checklist não encontrado');
    }

    return this.repo.setActiveMapping(
      data.tipoEquipeId,
      data.checklistId,
      userId
    );
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistTipoEquipeRelacao>> {
    const { items, total } = await this.repo.list(params as any);
    return { data: items, total, totalPages: Math.ceil(total / params.pageSize), page: params.page, pageSize: params.pageSize };
  }

  protected getSearchFields(): string[] { return []; }
}

