/**
 * Serviço para Eletricistas
 *
 * Este serviço fornece operações CRUD para a entidade Eletricista,
 * utilizando o padrão Service e estendendo a classe abstrata AbstractCrudService.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Busca por nome, matrícula e telefone
 * - Soft delete com auditoria
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const service = new EletricistaService(new EletricistaRepository());
 * const eletricista = await service.create({ nome: 'João da Silva', matricula: '123456', telefone: '1234567890' }, '1');
 * const eletricista = await service.update({ id: 1, nome: 'João da Silva', matricula: '123456', telefone: '1234567890' }, '1');
 * const eletricista = await service.delete(1, '1');
 * const eletricista = await service.getById(1);
 * const eletricistas = await service.list({ page: 1, pageSize: 10 });
 * ```
 */

import { Eletricista } from '@nexa-oper/db';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { EletricistaRepository } from '../repositories/pessoas/EletricistaRepository';
import { EletricistaCreate, eletricistaCreateSchema, EletricistaFilter, EletricistaUpdate, eletricistaUpdateSchema } from '../schemas/eletricistaSchema';
import { PaginatedResult } from '../types/common';

/**
 * Tipo para dados brutos recebidos do handleServerAction (inclui campos de auditoria)
 */
type EletricistaCreateWithAudit = EletricistaCreate & {
  createdBy?: string;
  createdAt?: Date;
};

type EletricistaUpdateWithAudit = EletricistaUpdate & {
  updatedBy?: string;
  updatedAt?: Date;
};

export class EletricistaService extends AbstractCrudService<
  EletricistaCreate,
  EletricistaUpdate,
  EletricistaFilter,
  Eletricista
> {
  private eletricistaRepo: EletricistaRepository;
  /**
   * Construtor do serviço
   *
   * Inicializa o repositório e registra o serviço no container
   */
  constructor() {
    const repo = new EletricistaRepository();
    // EletricistaRepository tem assinatura customizada de create que aceita status e baseId
    // Por isso fazemos cast para compatibilidade com AbstractCrudService
    // O cast é necessário porque o AbstractCrudService espera um ICrudRepository genérico
    // mas EletricistaRepository implementa métodos com assinaturas específicas
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(repo as any);
    this.eletricistaRepo = repo;
  }

  /**
   * Cria um novo eletricista
   *
   * @param raw - Dados brutos do eletricista
   * @param userId - ID do usuário que está criando
   * @returns Eletricista criado
   */
  async create(raw: EletricistaCreateWithAudit, userId: string): Promise<Eletricista> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = eletricistaCreateSchema.parse(businessData);

    const { baseId, ...eletricistaCoreData } = data;
    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    if (normalizedBaseId === undefined || Number.isNaN(normalizedBaseId)) {
      throw new Error('Base é obrigatória');
    }

    // Reconstrói com auditoria
    return this.eletricistaRepo.create(
      {
        ...eletricistaCoreData,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      } as EletricistaCreate & { createdBy?: string; createdAt?: Date },
      userId,
      normalizedBaseId
    );
  }

  /**
   * Atualiza um eletricista existente
   *
   * @param raw - Dados brutos do eletricista
   * @param userId - ID do usuário que está atualizando
   * @returns Eletricista atualizado
   */
  async update(raw: EletricistaUpdateWithAudit, userId: string): Promise<Eletricista> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { updatedBy, updatedAt, ...businessData } = raw;

    // Valida os dados de negócio
    const data = eletricistaUpdateSchema.parse(businessData);

    const { baseId, ...eletricistaCoreData } = data;
    const normalizedBaseId =
      baseId === undefined || baseId === null ? undefined : Number(baseId);

    if (normalizedBaseId !== undefined && Number.isNaN(normalizedBaseId)) {
      throw new Error('Base inválida');
    }

    // Reconstrói com auditoria
    return this.eletricistaRepo.update(
      eletricistaCoreData.id,
      {
        ...eletricistaCoreData,
        ...(updatedBy && { updatedBy }),
        ...(updatedAt && { updatedAt }),
      } as EletricistaUpdate & { updatedBy?: string; updatedAt?: Date },
      userId,
      normalizedBaseId
    );
  }

  /**
   * Exclui um eletricista existente
   *
   * @param id - ID do eletricista
   * @param userId - ID do usuário que está excluindo
   * @returns Eletricista excluído
   */
  async delete(id: number, userId: string): Promise<Eletricista> {
    return this.eletricistaRepo.delete(id, userId);
  }

  /**
   * Busca um eletricista por ID
   *
   * @param id - ID do eletricista
   * @returns Eletricista encontrado ou null
   */
  async getById(id: number): Promise<Eletricista | null> {
    return this.eletricistaRepo.findById(id);
  }

  /**
   * Lista eletricistas com paginação
   *
   * @param params - Parâmetros de paginação e filtro
   * @returns Resultado paginado
   */
  async list(params: EletricistaFilter): Promise<PaginatedResult<Eletricista>> {
    const { items, total } = await this.eletricistaRepo.list(params);
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
   * Busca eletricistas por nome
   *
   * @param nome - Nome do eletricista
   * @returns Array de eletricistas
   */
  async searchByNome(nome: string): Promise<Eletricista[]> {
    return this.eletricistaRepo.findByNome(nome);
  }

  /**
   * Busca eletricistas por matrícula
   *
   * @param matricula - Matrícula do eletricista
   * @returns Array de eletricistas
   */
  async searchByMatricula(matricula: string): Promise<Eletricista[]> {
    return this.eletricistaRepo.findByMatricula(matricula);
  }

  /**
   * Busca eletricistas por contrato
   *
   * @param contratoId - ID do contrato
   * @returns Array de eletricistas
   */
  async searchByContratoId(contratoId: number): Promise<Eletricista[]> {
    return this.eletricistaRepo.findByContratoId(contratoId);
  }
}
