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
  constructor() {
    const repo = new ChecklistTipoEquipeRelacaoRepository();
    // Cast necessário pois os métodos create/update são sobrescritos nesta classe
    super(repo as any);
  }

  /**
   * Acessa o repository com tipo específico para operações customizadas
   */
  private get customRepo(): ChecklistTipoEquipeRelacaoRepository {
    return (this as any).repo as unknown as ChecklistTipoEquipeRelacaoRepository;
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

    return this.customRepo.setActiveMapping(
      data.tipoEquipeId,
      data.checklistId,
      userId
    );
  }

  /**
   * Implementa método create requerido pelo AbstractCrudService
   * Delega para setMapping que é o método específico desta entidade
   */
  async create(data: z.infer<typeof setChecklistTipoEquipeSchema>, userId: string): Promise<ChecklistTipoEquipeRelacao> {
    return this.setMapping(data, userId);
  }

  /**
   * Implementa método update requerido pelo AbstractCrudService
   * Update não é usado neste contexto - delega para setMapping
   */
  async update(data: any, userId: string): Promise<ChecklistTipoEquipeRelacao> {
    // Como update não é usado, tratamos como create/setMapping
    if (data.tipoEquipeId && data.checklistId) {
      return this.setMapping(
        {
          tipoEquipeId: data.tipoEquipeId,
          checklistId: data.checklistId,
        },
        userId
      );
    }
    throw new Error('Update não suportado para ChecklistTipoEquipeVinculo');
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistTipoEquipeRelacao>> {
    const { items, total } = await this.customRepo.list(params as any);
    return { data: items, total, totalPages: Math.ceil(total / params.pageSize), page: params.page, pageSize: params.pageSize };
  }

  protected getSearchFields(): string[] { return []; }
}

