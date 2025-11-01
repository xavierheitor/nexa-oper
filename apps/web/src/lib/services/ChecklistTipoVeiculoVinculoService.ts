import { ChecklistTipoVeiculoRelacao } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { ChecklistTipoVeiculoRelacaoRepository } from '../repositories/ChecklistTipoVeiculoRelacaoRepository';
import { PaginatedResult } from '../types/common';
import { prisma } from '../db/db.service';

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
  constructor() {
    const repo = new ChecklistTipoVeiculoRelacaoRepository();
    // Cast necessário pois os métodos create/update são sobrescritos nesta classe
    super(repo as any);
  }

  /**
   * Acessa o repository com tipo específico para operações customizadas
   */
  private get customRepo(): ChecklistTipoVeiculoRelacaoRepository {
    return (this as any).repo as unknown as ChecklistTipoVeiculoRelacaoRepository;
  }

  async setMapping(data: z.infer<typeof setChecklistTipoVeiculoSchema>, userId: string) {
    // Validação de regra de negócio: verificar se checklist existe
    const checklist = await prisma.checklist.findUnique({
      where: { id: data.checklistId },
      select: { id: true },
    });

    if (!checklist) {
      throw new Error('Checklist não encontrado');
    }

    return this.customRepo.setActiveMapping(
      data.tipoVeiculoId,
      data.checklistId,
      userId
    );
  }

  /**
   * Implementa método create requerido pelo AbstractCrudService
   * Delega para setMapping que é o método específico desta entidade
   */
  async create(data: z.infer<typeof setChecklistTipoVeiculoSchema>, userId: string): Promise<ChecklistTipoVeiculoRelacao> {
    return this.setMapping(data, userId);
  }

  /**
   * Implementa método update requerido pelo AbstractCrudService
   * Update não é usado neste contexto - delega para setMapping
   */
  async update(data: any, userId: string): Promise<ChecklistTipoVeiculoRelacao> {
    // Como update não é usado, tratamos como create/setMapping
    if (data.tipoVeiculoId && data.checklistId) {
      return this.setMapping(
        {
          tipoVeiculoId: data.tipoVeiculoId,
          checklistId: data.checklistId,
        },
        userId
      );
    }
    throw new Error('Update não suportado para ChecklistTipoVeiculoVinculo');
  }

  async list(params: Filter): Promise<PaginatedResult<ChecklistTipoVeiculoRelacao>> {
    const { items, total } = await this.customRepo.list(params as any);
    return { data: items, total, totalPages: Math.ceil(total / params.pageSize), page: params.page, pageSize: params.pageSize };
  }

  protected getSearchFields(): string[] { return []; }
}

