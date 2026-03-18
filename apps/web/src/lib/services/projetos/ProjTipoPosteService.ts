import { ProjTipoPoste } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { ProjTipoPosteRepository } from '../../repositories/projetos/ProjTipoPosteRepository';
import {
  projTipoPosteCreateSchema,
  projTipoPosteFilterSchema,
  projTipoPosteUpdateSchema,
} from '../../schemas/projTipoPosteSchema';
import { PaginatedResult } from '../../types/common';

type ProjTipoPosteCreate = z.infer<typeof projTipoPosteCreateSchema>;
type ProjTipoPosteUpdate = z.infer<typeof projTipoPosteUpdateSchema>;
type ProjTipoPosteFilter = z.infer<typeof projTipoPosteFilterSchema>;

export class ProjTipoPosteService extends AbstractCrudService<
  ProjTipoPosteCreate,
  ProjTipoPosteUpdate,
  ProjTipoPosteFilter,
  ProjTipoPoste
> {
  constructor() {
    super(new ProjTipoPosteRepository());
  }

  async create(raw: any, _userId: string): Promise<ProjTipoPoste> {
    const { createdBy, createdAt, ...businessData } = raw;
    const data = projTipoPosteCreateSchema.parse(businessData);

    return this.repo.create({
      ...data,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as any);
  }

  async update(raw: any, _userId: string): Promise<ProjTipoPoste> {
    const { updatedBy, updatedAt, ...businessData } = raw;
    const data = projTipoPosteUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    return this.repo.update(id, {
      ...rest,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    } as any);
  }

  async delete(id: number, userId: string): Promise<ProjTipoPoste> {
    return this.repo.delete(id, userId);
  }

  async getById(id: number): Promise<ProjTipoPoste | null> {
    return this.repo.findById(id);
  }

  async list(params: ProjTipoPosteFilter): Promise<PaginatedResult<ProjTipoPoste>> {
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
