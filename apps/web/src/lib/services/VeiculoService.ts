/**
 * Serviço para Veículos
 *
 * Este serviço implementa a lógica de negócio para operações
 * relacionadas a veículos, incluindo validação, transformação
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
 * const service = new VeiculoService();
 * const veiculo = await service.create(data, userId);
 * const veiculos = await service.list(filterParams);
 * ```
 */

import { Veiculo } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import {
  VeiculoCreateInput,
  VeiculoRepository,
} from '../repositories/infraestrutura/VeiculoRepository';
import {
  veiculoCreateSchema,
  veiculoFilterSchema,
  veiculoUpdateSchema,
} from '../schemas/veiculoSchema';
import { PaginatedResult } from '../types/common';

// Tipos derivados dos schemas
type VeiculoCreate = z.infer<typeof veiculoCreateSchema>;
type VeiculoUpdate = z.infer<typeof veiculoUpdateSchema>;
type VeiculoFilter = z.infer<typeof veiculoFilterSchema>;

export class VeiculoService extends AbstractCrudService<
  VeiculoCreate,
  VeiculoUpdate,
  VeiculoFilter,
  Veiculo
> {
  private veiculoRepo: VeiculoRepository;

  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    const repo = new VeiculoRepository();
    super(repo);
    this.veiculoRepo = repo;
  }

  /**
   * Cria um novo veículo
   *
   * @param data - Dados do veículo (validados pelo schema)
   * @param userId - ID do usuário que está criando
   * @returns Veículo criado
   */
  async create(data: VeiculoCreate, userId: string): Promise<Veiculo> {
    // Converte os dados do schema para o formato do repositório
    const { baseId, ...veiculoCore } = data;
    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    if (normalizedBaseId === undefined || Number.isNaN(normalizedBaseId)) {
      throw new Error('Base é obrigatória');
    }

    const createData: VeiculoCreateInput = {
      placa: veiculoCore.placa,
      modelo: veiculoCore.modelo,
      ano: veiculoCore.ano,
      tipoVeiculoId: veiculoCore.tipoVeiculoId,
      contratoId: veiculoCore.contratoId,
      baseId: normalizedBaseId,
    };

    // Cria o veículo através do repositório com auditoria
    return this.veiculoRepo.create(createData, userId);
  }

  /**
   * Atualiza um veículo existente
   *
   * @param data - Dados para atualização (incluindo ID)
   * @param userId - ID do usuário que está atualizando
   * @returns Veículo atualizado
   */
  async update(data: VeiculoUpdate, userId: string): Promise<Veiculo> {
    const { id, ...updateData } = data;
    const { baseId, ...veiculoCore } = updateData;
    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    if (normalizedBaseId !== undefined && Number.isNaN(normalizedBaseId)) {
      throw new Error('Base inválida');
    }

    // Converte os dados do schema para o formato do repositório
    const updateInput: Partial<VeiculoCreateInput> = {
      ...(veiculoCore.placa && { placa: veiculoCore.placa }),
      ...(veiculoCore.modelo && { modelo: veiculoCore.modelo }),
      ...(veiculoCore.ano && { ano: veiculoCore.ano }),
      ...(veiculoCore.tipoVeiculoId && {
        tipoVeiculoId: veiculoCore.tipoVeiculoId,
      }),
      ...(veiculoCore.contratoId && { contratoId: veiculoCore.contratoId }),
      ...(normalizedBaseId !== undefined && { baseId: normalizedBaseId }),
    };

    // Atualiza através do repositório
    return this.veiculoRepo.update(id, updateInput, userId);
  }

  /**
   * Exclui um veículo existente
   *
   * @param id - ID do veículo
   * @param userId - ID do usuário que está excluindo
   * @returns Veículo excluído
   */
  async delete(id: number, userId: string): Promise<Veiculo> {
    return this.veiculoRepo.delete(id, userId);
  }

  /**
   * Busca um veículo por ID
   *
   * @param id - ID do veículo
   * @returns Veículo encontrado ou null
   */
  async getById(id: number): Promise<Veiculo | null> {
    return this.veiculoRepo.findById(id);
  }

  /**
   * Lista veículos com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: VeiculoFilter): Promise<PaginatedResult<Veiculo>> {
    const { items, total } = await this.veiculoRepo.list(params);
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
    return ['placa', 'modelo'];
  }
}
