import { TipoAtividade } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { TipoAtividadeRepository } from '../../repositories/catalogo/TipoAtividadeRepository';
import {
  tipoAtividadeCreateSchema,
  tipoAtividadeFilterSchema,
  tipoAtividadeUpdateSchema,
} from '../../schemas/tipoAtividadeSchema';
import { PaginatedResult } from '../../types/common';

type Create = z.infer<typeof tipoAtividadeCreateSchema>;
type Update = z.infer<typeof tipoAtividadeUpdateSchema>;
type Filter = z.infer<typeof tipoAtividadeFilterSchema>;

export class TipoAtividadeService extends AbstractCrudService<
  Create,
  Update,
  Filter,
  TipoAtividade
> {
  private tipoAtividadeRepo: TipoAtividadeRepository;

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório
   */
  constructor() {
    const repo = new TipoAtividadeRepository();
    super(repo);
    this.tipoAtividadeRepo = repo;
  }

  /**
   * Cria um novo tipo de atividade
   *
   * @param data - Dados do tipo de atividade
   * @param userId - ID do usuário que está criando
   * @returns Tipo de atividade criado
   */
  async create(data: Create, userId: string): Promise<TipoAtividade> {
    return this.tipoAtividadeRepo.create({ nome: data.nome, createdBy: userId }, userId);
  }

  /**
   * Atualiza um tipo de atividade existente
   *
   * @param data - Dados do tipo de atividade
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de atividade atualizado
   */
  async update(data: Update, userId: string): Promise<TipoAtividade> {
    const { id, ...rest } = data;
    return this.tipoAtividadeRepo.update(id, rest, userId);
  }
}

