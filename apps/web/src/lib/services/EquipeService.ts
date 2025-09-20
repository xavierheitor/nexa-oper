/**
 * Serviço para Equipes
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a equipes, incluindo validação, transformação
 * de dados e integração com o repositório.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Lógica de negócio centralizada
 * - Integração com repositório
 * - Tratamento de erros
 * - Auditoria automática
 * - Conversão de tipos para relacionamentos
 *
 * COMO USAR:
 * ```typescript
 * const service = new EquipeService();
 * const equipe = await service.create(data, userId);
 * const equipes = await service.list(filterParams);
 * ```
 */

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

// Tipos derivados dos schemas
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

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    const repo = new EquipeRepository();
    super(repo);
    this.equipeRepo = repo;
  }

  /**
   * Cria uma nova equipe
   *
   * @param data - Dados da equipe (validados pelo schema)
   * @param userId - ID do usuário que está criando
   * @returns Equipe criada
   */
  async create(data: EquipeCreate, userId: string): Promise<Equipe> {
    // Converte os dados do schema para o formato do repositório
    const createData: EquipeCreateInput = {
      nome: data.nome,
      tipoEquipeId: data.tipoEquipeId,
      contratoId: data.contratoId,
    };

    // Cria a equipe através do repositório com auditoria
    return this.equipeRepo.create(createData, userId);
  }

  /**
   * Atualiza uma equipe existente
   *
   * @param data - Dados para atualização (incluindo ID)
   * @param userId - ID do usuário que está atualizando
   * @returns Equipe atualizada
   */
  async update(data: EquipeUpdate, userId: string): Promise<Equipe> {
    const { id, ...updateData } = data;

    // Converte os dados do schema para o formato do repositório
    const updateInput: Partial<EquipeCreateInput> = {
      ...(updateData.nome && { nome: updateData.nome }),
      ...(updateData.tipoEquipeId && {
        tipoEquipeId: updateData.tipoEquipeId,
      }),
      ...(updateData.contratoId && { contratoId: updateData.contratoId }),
    };

    // Atualiza através do repositório
    return this.equipeRepo.update(id, updateInput, userId);
  }

  /**
   * Exclui uma equipe existente
   *
   * @param id - ID da equipe
   * @param userId - ID do usuário que está excluindo
   * @returns Equipe excluída
   */
  async delete(id: number, userId: string): Promise<Equipe> {
    return this.equipeRepo.delete(id, userId);
  }

  /**
   * Busca uma equipe por ID
   *
   * @param id - ID da equipe
   * @returns Equipe encontrada ou null
   */
  async getById(id: number): Promise<Equipe | null> {
    return this.equipeRepo.findById(id);
  }

  /**
   * Lista equipes com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
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

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
