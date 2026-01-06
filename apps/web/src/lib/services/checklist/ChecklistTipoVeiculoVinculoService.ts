import { ChecklistTipoVeiculoRelacao } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ChecklistTipoVeiculoRelacaoRepository } from '../../repositories/checklist/ChecklistTipoVeiculoRelacaoRepository';
import { PaginatedResult, IncludeConfig } from '../../types/common';
import { prisma } from '../../db/db.service';

export const setChecklistTipoVeiculoSchema = z.object({
  tipoVeiculoId: z.number().int(),
  checklistId: z.number().int(),
});

type Filter = { page: number; pageSize: number; orderBy: string; orderDir: 'asc' | 'desc'; include?: IncludeConfig };

export class ChecklistTipoVeiculoVinculoService extends AbstractCrudService<
  z.infer<typeof setChecklistTipoVeiculoSchema>,
  z.infer<typeof setChecklistTipoVeiculoSchema> & { id?: number },
  Filter,
  ChecklistTipoVeiculoRelacao
> {
  private readonly customRepo: ChecklistTipoVeiculoRelacaoRepository;

  constructor() {
    const repo = new ChecklistTipoVeiculoRelacaoRepository();
    // @ts-expect-error - O repositório tem tipos de input diferentes (usa objetos Prisma), mas funciona no runtime
    super(repo);
    this.customRepo = repo;
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
  async update(
    data: z.infer<typeof setChecklistTipoVeiculoSchema> & { id?: number },
    userId: string
  ): Promise<ChecklistTipoVeiculoRelacao> {
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
    const { items, total } = await this.customRepo.list(params);
    return { data: items, total, totalPages: Math.ceil(total / params.pageSize), page: params.page, pageSize: params.pageSize };
  }

  protected getSearchFields(): string[] { return []; }
}

