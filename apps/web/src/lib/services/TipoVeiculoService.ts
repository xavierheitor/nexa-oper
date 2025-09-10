/**
 * Serviço para Tipos de Veículo
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a tipos de veículo, incluindo validação, transformação
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
 * const service = new TipoVeiculoService();
 * const tipo = await service.create(data, userId);
 * const tipos = await service.list(filterParams);
 * ```
 */

import { TipoVeiculo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { TipoVeiculoRepository } from '../repositories/TipoVeiculoRepository';
import {
  tipoVeiculoCreateSchema,
  tipoVeiculoFilterSchema,
  tipoVeiculoUpdateSchema
} from '../schemas/tipoVeiculoSchema';
import { PaginatedResult } from '../types/common';

// Tipos derivados dos schemas
type TipoVeiculoCreate = z.infer<typeof tipoVeiculoCreateSchema>;
type TipoVeiculoUpdate = z.infer<typeof tipoVeiculoUpdateSchema>;
type TipoVeiculoFilter = z.infer<typeof tipoVeiculoFilterSchema>;

export class TipoVeiculoService extends AbstractCrudService<
  TipoVeiculoCreate,
  TipoVeiculoUpdate,
  TipoVeiculoFilter,
  TipoVeiculo
> {
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    super(new TipoVeiculoRepository());
  }

  /**
   * Cria um novo tipo de veículo
   *
   * @param raw - Dados brutos do tipo de veículo
   * @param userId - ID do usuário que está criando
   * @returns Tipo de veículo criado
   */
  async create(raw: unknown, userId: string): Promise<TipoVeiculo> {
    // Valida os dados de entrada
    const data = tipoVeiculoCreateSchema.parse(raw);

    // Adiciona campos de auditoria
    const tipoData = {
      ...data,
      createdBy: userId,
      createdAt: new Date(),
    };

    return this.repo.create(tipoData as any);
  }

  /**
   * Atualiza um tipo de veículo existente
   *
   * @param raw - Dados brutos do tipo de veículo
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de veículo atualizado
   */
  async update(raw: unknown, userId: string): Promise<TipoVeiculo> {
    // Valida os dados de entrada
    const data = tipoVeiculoUpdateSchema.parse(raw);
    const { id, ...rest } = data;

    // Adiciona campos de auditoria
    const updateData = {
      ...rest,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    return this.repo.update(id, updateData as any);
  }

  /**
   * Exclui um tipo de veículo existente
   *
   * @param id - ID do tipo de veículo
   * @param userId - ID do usuário que está excluindo
   * @returns Tipo de veículo excluído
   */
  async delete(id: number, userId: string): Promise<TipoVeiculo> {
    return this.repo.delete(id, userId);
  }

  /**
   * Busca um tipo de veículo por ID
   *
   * @param id - ID do tipo de veículo
   * @returns Tipo de veículo encontrado ou null
   */
  async getById(id: number): Promise<TipoVeiculo | null> {
    return this.repo.findById(id);
  }

  /**
   * Lista tipos de veículo com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: TipoVeiculoFilter): Promise<PaginatedResult<TipoVeiculo>> {
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