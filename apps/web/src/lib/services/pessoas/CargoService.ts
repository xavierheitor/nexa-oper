/**
 * Serviço para Cargo
 *
 * Gerencia lógica de negócio para cargos
 */

import { Cargo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  CargoCreateInput,
  CargoRepository,
  CargoUpdateInput,
} from '../../repositories/pessoas/CargoRepository';
import {
  cargoCreateSchema,
  cargoFilterSchema,
  cargoUpdateSchema,
} from '../../schemas/cargoSchema';

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

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório
   */
  constructor() {
    const repo = new CargoRepository();
    super(repo);
    this.cargoRepo = repo;
  }

  /**
   * Cria um novo cargo
   *
   * @param data - Dados do cargo
   * @param userId - ID do usuário que está criando
   * @returns Cargo criado
   */
  async create(data: CargoCreate, userId: string): Promise<Cargo> {
    const createData: CargoCreateInput = {
      nome: data.nome,
      salarioBase: data.salarioBase,
    };

    return this.cargoRepo.create(createData, userId);
  }

  /**
   * Atualiza um cargo existente
   *
   * @param data - Dados do cargo
   * @param userId - ID do usuário que está atualizando
   * @returns Cargo atualizado
   */
  async update(data: CargoUpdate, userId: string): Promise<Cargo> {
    const cargo = await this.repo.findById(data.id);
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
}
