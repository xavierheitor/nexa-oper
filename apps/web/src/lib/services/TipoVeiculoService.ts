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
  async create(raw: any, userId: string): Promise<TipoVeiculo> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = tipoVeiculoCreateSchema.parse(businessData);

    // Reconstrói com auditoria
    return this.repo.create({
      ...data,
      ...(createdBy && { createdBy }),
      ...(createdAt && { createdAt }),
    } as any);
  }

  /**
   * Atualiza um tipo de veículo existente
   *
   * @param raw - Dados brutos do tipo de veículo
   * @param userId - ID do usuário que está atualizando
   * @returns Tipo de veículo atualizado
   */
  async update(raw: any, userId: string): Promise<TipoVeiculo> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = tipoVeiculoUpdateSchema.parse(businessData);
    const { id, ...rest } = data;

    // Reconstrói com auditoria
    return this.repo.update(id, {
      ...rest,
      ...(updatedBy && { updatedBy }),
      ...(updatedAt && { updatedAt }),
    } as any);
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
