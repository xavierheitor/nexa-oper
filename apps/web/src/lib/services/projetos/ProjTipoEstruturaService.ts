import { ProjTipoEstrutura } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjTipoEstruturaRepository } from '../../repositories/projetos/ProjTipoEstruturaRepository';
import {
  projTipoEstruturaCreateSchema,
  projTipoEstruturaFilterSchema,
  projTipoEstruturaUpdateSchema,
} from '../../schemas/projTipoEstruturaSchema';
import type { PaginatedResult } from '../../types/common';

type ProjTipoEstruturaCreate = z.infer<typeof projTipoEstruturaCreateSchema>;
type ProjTipoEstruturaUpdate = z.infer<typeof projTipoEstruturaUpdateSchema>;
type ProjTipoEstruturaFilter = z.infer<typeof projTipoEstruturaFilterSchema>;

export class ProjTipoEstruturaService extends AbstractCrudService<
  ProjTipoEstruturaCreate,
  ProjTipoEstruturaUpdate,
  ProjTipoEstruturaFilter,
  ProjTipoEstrutura,
  ProjTipoEstruturaRepository
> {
  constructor() {
    super(new ProjTipoEstruturaRepository());
  }

  async create(raw: unknown, userId: string): Promise<ProjTipoEstrutura> {
    const data = projTipoEstruturaCreateSchema.parse(raw);

    return this.repo.create(
      {
        nome: data.nome,
        createdBy: userId,
        contrato: {
          connect: {
            id: data.contratoId,
          },
        },
      },
      userId
    );
  }

  async update(raw: unknown, userId: string): Promise<ProjTipoEstrutura> {
    const data = projTipoEstruturaUpdateSchema.parse(raw);
    const { id, contratoId, nome } = data;

    return this.repo.update(
      id,
      {
        nome,
        updatedBy: userId,
        contrato: {
          connect: {
            id: contratoId,
          },
        },
      },
      userId
    );
  }

  async delete(id: number, userId: string): Promise<ProjTipoEstrutura> {
    return this.repo.delete(id, userId);
  }

  async getById(id: number): Promise<ProjTipoEstrutura | null> {
    return this.repo.findById(id);
  }

  async list(
    params: ProjTipoEstruturaFilter
  ): Promise<PaginatedResult<ProjTipoEstrutura>> {
    const { items, total } = await this.repo.list(params);
    const totalPages = Math.ceil(total / params.pageSize);

    return {
      data: items,
      total,
      totalPages,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
