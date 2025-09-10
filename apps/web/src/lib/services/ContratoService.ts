/**
 * Serviço para Contratos
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a contratos, incluindo validação, transformação
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
 * const service = new ContratoService();
 * const contrato = await service.create(data, userId);
 * const contratos = await service.list(filterParams);
 * ```
 */

import { ContratoRepository } from '@/lib/repositories/ContratoRepository';
import {
  contratoCreateSchema,
  contratoFilterSchema,
  contratoUpdateSchema,
} from '@/lib/schemas/contratoSchema';
import { Contrato } from '@nexa-oper/db';
import z from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { PaginatedResult } from '../types/common';

// Tipos derivados dos schemas
type ContratoCreate = z.infer<typeof contratoCreateSchema>;
type ContratoUpdate = z.infer<typeof contratoUpdateSchema>;
type ContratoFilter = z.infer<typeof contratoFilterSchema>;

export class ContratoService extends AbstractCrudService<
  ContratoCreate,
  ContratoUpdate,
  ContratoFilter,
  Contrato
> {
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    super(new ContratoRepository());
  }

  /**
   * Cria um novo contrato
   *
   * @param raw - Dados brutos do contrato
   * @param userId - ID do usuário que está criando
   * @returns Contrato criado
   */
  async create(raw: unknown, userId: string): Promise<Contrato> {
    // Valida os dados de entrada
    const data = contratoCreateSchema.parse(raw);

    // Adiciona campos de auditoria
    const contratoData = {
      ...data,
      createdBy: userId,
      createdAt: new Date(),
    };

    return this.repo.create(contratoData as any);
  }

  /**
   * Atualiza um contrato existente
   *
   * @param raw - Dados brutos do contrato
   * @param userId - ID do usuário que está atualizando
   * @returns Contrato atualizado
   */
  async update(raw: unknown, userId: string): Promise<Contrato> {
    // Valida os dados de entrada
    const data = contratoUpdateSchema.parse(raw);
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
   * Exclui um contrato existente
   *
   * @param id - ID do contrato
   * @param userId - ID do usuário que está excluindo
   * @returns Contrato excluído
   */
  async delete(id: number, userId: string): Promise<Contrato> {
    return this.repo.delete(id, userId);
  }

  /**
   * Busca um contrato por ID
   *
   * @param id - ID do contrato
   * @returns Contrato encontrado ou null
   */
  async getById(id: number): Promise<Contrato | null> {
    return this.repo.findById(id);
  }

  /**
   * Lista contratos com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: ContratoFilter): Promise<PaginatedResult<Contrato>> {
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
    return ['nome', 'numero'];
  }
}
