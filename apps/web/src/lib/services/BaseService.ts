/**
 * Serviço para Bases
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a bases, incluindo validação, transformação
 * de dados e integração com o repositório.
 *
 * FUNCIONALIDADES:
 * - Validação de dados com Zod
 * - Lógica de negócio centralizada
 * - Integração com repositório
 * - Tratamento de erros
 * - Auditoria automática
 *
 * COMO USAR:
 * ```typescript
 * const service = new BaseService();
 * const base = await service.create(data, userId);
 * const bases = await service.list(filterParams);
 * ```
 */

import { Base } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { BaseRepository } from '../repositories/infraestrutura/BaseRepository';
import {
  baseCreateSchema,
  baseFilterSchema,
  baseUpdateSchema,
} from '../schemas/baseSchema';
import { PaginatedResult } from '../types/common';

// Tipos derivados dos schemas
type BaseCreate = z.infer<typeof baseCreateSchema>;
type BaseUpdate = z.infer<typeof baseUpdateSchema>;
type BaseFilter = z.infer<typeof baseFilterSchema>;

export class BaseService extends AbstractCrudService<
  BaseCreate,
  BaseUpdate,
  BaseFilter,
  Base
> {
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    super(new BaseRepository());
  }

  /**
   * Cria uma nova base
   *
   * @param raw - Dados brutos da base
   * @param userId - ID do usuário que está criando
   * @returns Base criada
   */
  async create(raw: any, userId: string): Promise<Base> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = baseCreateSchema.parse(businessData);

    // Reconstrói com auditoria
    return this.repo.create({
      nome: data.nome,
      contratoId: data.contratoId,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as Base);
  }

  /**
   * Atualiza uma base existente
   *
   * @param raw - Dados brutos da base
   * @param userId - ID do usuário que está atualizando
   * @returns Base atualizada
   */
  async update(raw: any, userId: string): Promise<Base> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = baseUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    // Reconstrói com auditoria
    const updateData: Partial<Base> = {
      nome: rest.nome,
      contratoId: rest.contratoId,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    };

    return this.repo.update(id, updateData);
  }

  /**
   * Exclui uma base existente
   *
   * @param id - ID da base
   * @param userId - ID do usuário que está excluindo
   * @returns Base excluída
   */
  async delete(id: number, userId: string): Promise<Base> {
    return this.repo.delete(id, userId);
  }

  /**
   * Busca uma base por ID
   *
   * @param id - ID da base
   * @returns Base encontrada ou null
   */
  async getById(id: number): Promise<Base | null> {
    return this.repo.findById(id);
  }

  /**
   * Lista bases com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: BaseFilter): Promise<PaginatedResult<Base>> {
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

  /**
   * Define os campos que podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
