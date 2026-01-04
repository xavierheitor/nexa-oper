import { Supervisor } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  SupervisorCreateInput,
  SupervisorRepository,
} from '../repositories/pessoas/SupervisorRepository';
import {
  supervisorCreateSchema,
  supervisorFilterSchema,
  supervisorUpdateSchema,
} from '../schemas/supervisorSchema';
import { PaginatedResult } from '../types/common';

type SupervisorCreate = z.infer<typeof supervisorCreateSchema>;
type SupervisorUpdate = z.infer<typeof supervisorUpdateSchema>;
type SupervisorFilter = z.infer<typeof supervisorFilterSchema>;

export class SupervisorService extends AbstractCrudService<
  SupervisorCreate,
  SupervisorUpdate,
  SupervisorFilter,
  Supervisor
> {
  private supervisorRepo: SupervisorRepository;

  constructor() {
    const repo = new SupervisorRepository();
    super(repo);
    this.supervisorRepo = repo;
  }

  async create(data: SupervisorCreate, userId: string): Promise<Supervisor> {
    const createData: SupervisorCreateInput = {
      nome: data.nome,
      contratoId: data.contratoId,
    };
    return this.supervisorRepo.create(createData, userId);
  }

  async update(data: SupervisorUpdate, userId: string): Promise<Supervisor> {
    const { id, ...updateData } = data;
    return this.supervisorRepo.update(id, updateData, userId);
  }

  async delete(id: number, userId: string): Promise<Supervisor> {
    return this.supervisorRepo.delete(id, userId);
  }

  async getById(id: number): Promise<Supervisor | null> {
    return this.supervisorRepo.findById(id);
  }

  async list(params: SupervisorFilter): Promise<PaginatedResult<Supervisor>> {
    const { items, total } = await this.supervisorRepo.list(params);
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

