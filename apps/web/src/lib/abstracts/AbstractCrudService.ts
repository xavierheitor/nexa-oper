/**
 * Classe Abstrata para Serviços CRUD
 *
 * Esta classe fornece uma implementação base para serviços
 * que implementam operações CRUD, incluindo validação,
 * lógica de negócio e integração com repositórios.
 *
 * FUNCIONALIDADES:
 * - Implementação base de operações CRUD
 * - Integração com repositórios
 * - Validação de dados
 * - Lógica de negócio centralizada
 * - Tratamento de erros
 *
 * COMO USAR:
 * ```typescript
 * export class ContratoService extends AbstractCrudService<ContratoCreate, ContratoUpdate, ContratoFilter, Contrato> {
 *   constructor() {
 *     super(new ContratoRepository());
 *   }
 *
 *   async create(data: ContratoCreate, userId: string) {
 *     // Lógica específica de criação
 *     return this.repo.create({ ...data, createdBy: userId });
 *   }
 * }
 * ```
 */

import { ICrudRepository } from '../interfaces/ICrudRepository';
import { ICrudService } from '../interfaces/ICrudService';
import type { PaginatedResult, PaginationParams } from '../types/common';

export abstract class AbstractCrudService<
  TCreate,
  TUpdate,
  TFilter extends PaginationParams,
  T,
> implements ICrudService<TCreate, TUpdate, TFilter, T>
{
  /**
   * Construtor da classe abstrata
   *
   * @param repo - Repositório para acesso a dados
   */
  constructor(protected repo: ICrudRepository<T, TFilter>) {}

  // Métodos abstratos que devem ser implementados pelas classes filhas
  abstract create(data: TCreate, userId: string): Promise<T>;
  abstract update(data: TUpdate, userId: string): Promise<T>;

  /**
   * Exclui um registro (soft delete)
   *
   * @param id - ID do registro
   * @param userId - ID do usuário que está excluindo
   * @returns Registro excluído
   */
  async delete(id: number | string, userId: string): Promise<T> {
    return this.repo.delete(id, String(userId));
  }

  /**
   * Busca um registro por ID
   *
   * @param id - ID do registro
   * @returns Registro encontrado ou null
   */
  async getById(id: number | string): Promise<T | null> {
    return this.repo.findById(id);
  }

  /**
   * Lista registros com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: TFilter): Promise<PaginatedResult<T>> {
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
}
