import { ProjTipoEstrutura } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjTipoEstruturaRepository } from '../../repositories/projetos/ProjTipoEstruturaRepository';
import {
  projTipoEstruturaCreateSchema,
  projTipoEstruturaFilterSchema,
  projTipoEstruturaUpdateSchema,
} from '../../schemas/projTipoEstruturaSchema';
import { PaginatedResult } from '../../types/common';

type ProjTipoEstruturaCreate = z.infer<typeof projTipoEstruturaCreateSchema>;
type ProjTipoEstruturaUpdate = z.infer<typeof projTipoEstruturaUpdateSchema>;
type ProjTipoEstruturaFilter = z.infer<typeof projTipoEstruturaFilterSchema>;

export class ProjTipoEstruturaService extends AbstractCrudService<
  ProjTipoEstruturaCreate,
  ProjTipoEstruturaUpdate,
  ProjTipoEstruturaFilter,
  ProjTipoEstrutura
> {
  constructor() {
    super(new ProjTipoEstruturaRepository());
  }

  async create(raw: any, _userId: string): Promise<ProjTipoEstrutura> {
    const { createdBy, createdAt, ...businessData } = raw;
    const data = projTipoEstruturaCreateSchema.parse(businessData);

    return this.repo.create({
      ...data,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as any);
  }

  async update(raw: any, _userId: string): Promise<ProjTipoEstrutura> {
    const { updatedBy, updatedAt, ...businessData } = raw;
    const data = projTipoEstruturaUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    return this.repo.update(id, {
      ...rest,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    } as any);
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
