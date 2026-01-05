import { Supervisor } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import {
  SupervisorCreateInput,
  SupervisorRepository,
} from '../../repositories/pessoas/SupervisorRepository';
import {
  supervisorCreateSchema,
  supervisorFilterSchema,
  supervisorUpdateSchema,
} from '../../schemas/supervisorSchema';

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

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório
   */
  constructor() {
    const repo = new SupervisorRepository();
    super(repo);
    this.supervisorRepo = repo;
  }

  /**
   * Cria um novo supervisor
   *
   * @param data - Dados do supervisor
   * @param userId - ID do usuário que está criando
   * @returns Supervisor criado
   */
  async create(data: SupervisorCreate, userId: string): Promise<Supervisor> {
    const createData: SupervisorCreateInput = {
      nome: data.nome,
      contratoId: data.contratoId,
    };
    return this.supervisorRepo.create(createData, userId);
  }

  /**
   * Atualiza um supervisor existente
   *
   * @param data - Dados do supervisor
   * @param userId - ID do usuário que está atualizando
   * @returns Supervisor atualizado
   */
  async update(data: SupervisorUpdate, userId: string): Promise<Supervisor> {
    const { id, ...updateData } = data;
    return this.supervisorRepo.update(id, updateData, userId);
  }
}

