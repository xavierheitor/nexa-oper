/**
 * Serviço para Tipos de Equipe
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a tipos de equipe, incluindo validação, transformação
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
 * const service = new TipoEquipeService();
 * const tipo = await service.create(data, userId);
 * const tipos = await service.list(filterParams);
 * ```
 */

import { TipoEquipe } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { TipoEquipeRepository } from '../../repositories/infraestrutura/TipoEquipeRepository';
import {
  tipoEquipeCreateSchema,
  tipoEquipeFilterSchema,
  tipoEquipeUpdateSchema,
} from '../../schemas/tipoEquipeSchema';
import { PaginatedResult } from '../../types/common';

// Tipos derivados dos schemas
type TipoEquipeCreate = z.infer<typeof tipoEquipeCreateSchema>;
type TipoEquipeUpdate = z.infer<typeof tipoEquipeUpdateSchema>;
type TipoEquipeFilter = z.infer<typeof tipoEquipeFilterSchema>;

export class TipoEquipeService extends AbstractCrudService<
  TipoEquipeCreate,
  TipoEquipeUpdate,
  TipoEquipeFilter,
  TipoEquipe
> {
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    super(new TipoEquipeRepository());
  }

  /**
   * Cria um novo tipo de equipe
   *
   * @param raw - Dados brutos do tipo de equipe
   * @param userId - ID do usuário que está criando
   * @returns Tipo de equipe criado
   */
  async create(raw: any, userId: string): Promise<TipoEquipe> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = tipoEquipeCreateSchema.parse(businessData);

    // Reconstrói com auditoria
    return this.repo.create({
      ...data,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as any);
  }

  /**
   * Atualiza um tipo de equipe existente
   *
   * @param raw - Dados brutos do tipo de equipe
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de equipe atualizado
   */
  async update(raw: any, userId: string): Promise<TipoEquipe> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = tipoEquipeUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    // Reconstrói com auditoria
    return this.repo.update(id, {
      ...rest,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    } as any);
  }

  /**
   * Exclui um tipo de equipe existente
   *
   * @param id - ID do tipo de equipe
   * @param userId - ID do usuário que está excluindo
   * @returns Tipo de equipe excluído
   */
  async delete(id: number, userId: string): Promise<TipoEquipe> {
    return this.repo.delete(id, userId);
  }

  /**
   * Busca um tipo de equipe por ID
   *
   * @param id - ID do tipo de equipe
   * @returns Tipo de equipe encontrado ou null
   */
  async getById(id: number): Promise<TipoEquipe | null> {
    return this.repo.findById(id);
  }

  /**
   * Lista tipos de equipe com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: TipoEquipeFilter): Promise<PaginatedResult<TipoEquipe>> {
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

