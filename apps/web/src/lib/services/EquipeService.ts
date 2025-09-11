import { Equipe } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  EquipeCreateInput,
  EquipeRepository,
} from '../repositories/EquipeRepository';
import {
  equipeCreateSchema,
  equipeFilterSchema,
  equipeUpdateSchema,
} from '../schemas/equipeSchema';
import { PaginatedResult } from '../types/common';

type EquipeCreate = z.infer<typeof equipeCreateSchema>;
type EquipeUpdate = z.infer<typeof equipeUpdateSchema>;
type EquipeFilter = z.infer<typeof equipeFilterSchema>;

export class EquipeService extends AbstractCrudService<
  EquipeCreate,
  EquipeUpdate,
  EquipeFilter,
  Equipe
> {
  private equipeRepo: EquipeRepository;

  constructor() {
    const repo = new EquipeRepository();
    super(repo);
    this.equipeRepo = repo;
  }

  async create(data: EquipeCreate, userId: string): Promise<Equipe> {
    const createData: EquipeCreateInput = {
      nome: data.nome,
      tipoEquipeId: data.tipoEquipeId,
      contratoId: data.contratoId,
    };
    return this.equipeRepo.create(createData, userId);
  }

  async update(data: EquipeUpdate, userId: string): Promise<Equipe> {
    const { id, ...updateData } = data;
    return this.equipeRepo.update(id, updateData, userId);
  }

  async delete(id: number, userId: string): Promise<Equipe> {
    return this.equipeRepo.delete(id, userId);
  }

  async getById(id: number): Promise<Equipe | null> {
    return this.equipeRepo.findById(id);
  }

  async list(params: EquipeFilter): Promise<PaginatedResult<Equipe>> {
    const { items, total } = await this.equipeRepo.list(params);
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

