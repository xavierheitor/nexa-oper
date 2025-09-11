import { EquipeSupervisor } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  EquipeSupervisorCreateInput,
  EquipeSupervisorRepository,
} from '../repositories/EquipeSupervisorRepository';
import {
  equipeSupervisorCreateSchema,
  equipeSupervisorFilterSchema,
  equipeSupervisorUpdateSchema,
} from '../schemas/equipeSupervisorSchema';
import { PaginatedResult } from '../types/common';

type ESCreate = z.infer<typeof equipeSupervisorCreateSchema>;
type ESUpdate = z.infer<typeof equipeSupervisorUpdateSchema>;
type ESFilter = z.infer<typeof equipeSupervisorFilterSchema>;

export class EquipeSupervisorService extends AbstractCrudService<
  ESCreate,
  ESUpdate,
  ESFilter,
  EquipeSupervisor
> {
  private repoConcrete: EquipeSupervisorRepository;

  constructor() {
    const repo = new EquipeSupervisorRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  async create(data: ESCreate, userId: string): Promise<EquipeSupervisor> {
    const createData: EquipeSupervisorCreateInput = {
      supervisorId: data.supervisorId,
      equipeId: data.equipeId,
      inicio: data.inicio,
      fim: data.fim ?? null,
    };
    return this.repoConcrete.create(createData, userId);
  }

  async update(data: ESUpdate, userId: string): Promise<EquipeSupervisor> {
    const { id, ...rest } = data;
    return this.repoConcrete.update(id, rest, userId);
  }

  async delete(id: number, userId: string): Promise<EquipeSupervisor> {
    return this.repoConcrete.delete(id, userId);
  }

  /**
   * Encerra o vínculo definindo a data de fim como hoje
   */
  async close(id: number, userId: string): Promise<EquipeSupervisor> {
    return this.repoConcrete.update(id, { fim: new Date() }, userId);
  }

  async getById(id: number): Promise<EquipeSupervisor | null> {
    return this.repoConcrete.findById(id);
  }

  async list(params: ESFilter): Promise<PaginatedResult<EquipeSupervisor>> {
    const { items, total } = await this.repoConcrete.list(params);
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
    return [];
  }
}
