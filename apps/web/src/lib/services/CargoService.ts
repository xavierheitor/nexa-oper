/**
 * Serviço para Cargo
 *
 * Gerencia lógica de negócio para cargos
 */

import { Cargo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  CargoCreateInput,
  CargoRepository,
  CargoUpdateInput,
} from '../repositories/CargoRepository';
import {
  cargoCreateSchema,
  cargoFilterSchema,
  cargoUpdateSchema,
} from '../schemas/cargoSchema';
import { PaginatedResult } from '../types/common';

type CargoCreate = z.infer<typeof cargoCreateSchema>;
type CargoUpdate = z.infer<typeof cargoUpdateSchema>;
type CargoFilter = z.infer<typeof cargoFilterSchema>;

export class CargoService extends AbstractCrudService<
  CargoCreate,
  CargoUpdate,
  CargoFilter,
  Cargo
> {
  private cargoRepo: CargoRepository;

  constructor() {
    const repo = new CargoRepository();
    super(repo);
    this.cargoRepo = repo;
  }

  async create(data: CargoCreate, userId: string): Promise<Cargo> {
    const createData: CargoCreateInput = {
      nome: data.nome,
      salarioBase: data.salarioBase,
    };

    return this.cargoRepo.create(createData, userId);
  }

  async update(data: CargoUpdate, userId: string): Promise<Cargo> {
    const cargo = await this.cargoRepo.findById(data.id);
    if (!cargo) {
      throw new Error('Cargo não encontrado');
    }

    const updateInput: CargoUpdateInput = {
      id: data.id,
      nome: data.nome,
      salarioBase: data.salarioBase,
    };

    return this.cargoRepo.update(data.id, updateInput, userId);
  }

  async list(params: CargoFilter): Promise<PaginatedResult<Cargo>> {
    const { items, total } = await this.cargoRepo.list(params);
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
