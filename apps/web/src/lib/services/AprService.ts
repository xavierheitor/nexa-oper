/**
 * Service para APR (Análise Preliminar de Risco)
 *
 * Implementa a camada de serviço para a entidade Apr,
 * contendo a lógica de negócio e validações específicas.
 * Atua como intermediário entre Controllers/Actions e Repository.
 *
 * RESPONSABILIDADES:
 * - Lógica de negócio específica de APR
 * - Validação de dados usando Zod schemas
 * - Transformação de dados entre camadas
 * - Orquestração de operações complexas
 * - Gerenciamento de relacionamentos
 * - Integração com Repository para persistência
 * - Herança do AbstractCrudService
 *
 * FUNCIONALIDADES ESPECIAIS:
 * - create(): Criação com vinculação automática de perguntas e opções
 * - update(): Atualização com reconfiguração de vínculos
 * - Gerenciamento de arrays de IDs para relacionamentos
 * - Validações de integridade referencial
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const service = new AprService();
 *
 * // Criar APR com vínculos
 * const apr = await service.create({
 *   nome: "APR Soldagem",
 *   perguntaIds: [1, 2, 3],
 *   opcaoRespostaIds: [1, 2]
 * }, "user123");
 *
 * // Atualizar APR e vínculos
 * await service.update({
 *   id: 1,
 *   nome: "APR Soldagem Atualizada",
 *   perguntaIds: [2, 3, 4],
 *   opcaoRespostaIds: [1]
 * }, "user123");
 * ```
 */

import { Apr } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../abstracts/AbstractCrudService';
import { AprRepository } from '../repositories/AprRepository';
import {
  aprCreateSchema,
  aprFilterSchema,
  aprUpdateSchema,
} from '../schemas/aprSchema';
import { PaginatedResult } from '../types/common';

// Tipos derivados dos schemas Zod para type safety
type AprCreate = z.infer<typeof aprCreateSchema>;
type AprUpdate = z.infer<typeof aprUpdateSchema>;
type AprFilter = z.infer<typeof aprFilterSchema>;

/**
 * Service para operações de negócio com APR
 *
 * Herda funcionalidades básicas do AbstractCrudService
 * e implementa lógica específica da entidade Apr, incluindo
 * gerenciamento de relacionamentos com perguntas e opções de resposta.
 */
export class AprService extends AbstractCrudService<
  AprCreate,
  AprUpdate,
  AprFilter,
  Apr
> {
  /** Referência concreta ao repository para operações específicas */
  private repoConcrete: AprRepository;

  /**
   * Construtor do service
   *
   * Inicializa o repository concreto e configura a herança
   * do AbstractCrudService para funcionalidades básicas.
   */
  constructor() {
    const repo = new AprRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  /**
   * Cria uma nova APR com relacionamentos
   *
   * Aplica validações de negócio, cria a APR base e
   * configura automaticamente os relacionamentos com
   * perguntas e opções de resposta.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Extrai arrays de IDs dos dados
   * 2. Cria a APR base no banco
   * 3. Configura vínculos com perguntas (se fornecidos)
   * 4. Configura vínculos com opções de resposta (se fornecidos)
   * 5. Retorna a APR criada
   *
   * @param data - Dados validados da APR incluindo arrays de IDs
   * @param userId - ID do usuário que está criando
   * @returns Promise com a APR criada
   *
   * @throws {Error} Se os dados forem inválidos
   * @throws {Error} Se houver erro na persistência
   * @throws {Error} Se IDs de pergunta/opção não existirem
   *
   * @example
   * ```typescript
   * const apr = await service.create({
   *   nome: "APR Trabalho em Altura",
   *   perguntaIds: [1, 2, 3], // IDs das perguntas
   *   opcaoRespostaIds: [1, 2] // IDs das opções
   * }, "user123");
   * ```
   */
  async create(data: any, userId: string): Promise<Apr> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const {
      createdBy,
      createdAt,
      perguntaIds = [],
      opcaoRespostaIds = [],
      ...aprData
    } = data;

    // Cria a APR base com auditoria
    const apr = await this.repoConcrete.create(
      {
        nome: aprData.nome,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      },
      userId
    );

    // Configura vínculos com perguntas se fornecidos
    if (perguntaIds.length > 0) {
      await this.repoConcrete.setPerguntas(apr.id, perguntaIds, userId);
    }

    // Configura vínculos com opções de resposta se fornecidos
    if (opcaoRespostaIds.length > 0) {
      await this.repoConcrete.setOpcoes(apr.id, opcaoRespostaIds, userId);
    }

    return apr;
  }

  /**
   * Atualiza uma APR existente com relacionamentos
   *
   * Atualiza os dados base da APR e reconfigura completamente
   * os relacionamentos com perguntas e opções de resposta.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Extrai ID e arrays de IDs dos dados
   * 2. Atualiza a APR base no banco
   * 3. Reconfigura vínculos com perguntas
   * 4. Reconfigura vínculos com opções de resposta
   * 5. Retorna a APR atualizada
   *
   * @param data - Dados validados incluindo ID e arrays de IDs
   * @param userId - ID do usuário que está atualizando
   * @returns Promise com a APR atualizada
   *
   * @throws {Error} Se a APR não for encontrada
   * @throws {Error} Se os dados forem inválidos
   * @throws {Error} Se IDs de pergunta/opção não existirem
   *
   * @example
   * ```typescript
   * const apr = await service.update({
   *   id: 1,
   *   nome: "APR Soldagem - Revisão 2",
   *   perguntaIds: [2, 3, 4], // Nova configuração
   *   opcaoRespostaIds: [1]   // Nova configuração
   * }, "user123");
   * ```
   */
  async update(data: AprUpdate, userId: string): Promise<Apr> {
    // Extrai ID, arrays de IDs e dados base
    const { id, perguntaIds = [], opcaoRespostaIds = [], ...aprData } = data;

    // Atualiza a APR base
    const apr = await this.repoConcrete.update(id, aprData, userId);

    // Reconfigura vínculos com perguntas
    await this.repoConcrete.setPerguntas(id, perguntaIds, userId);

    // Reconfigura vínculos com opções de resposta
    await this.repoConcrete.setOpcoes(id, opcaoRespostaIds, userId);

    return apr;
  }

  /**
   * Exclui uma APR (soft delete)
   *
   * Realiza soft delete marcando a APR como deletada.
   * Os relacionamentos são mantidos para auditoria.
   *
   * @param id - ID da APR a ser excluída
   * @param userId - ID do usuário que está excluindo
   * @returns Promise com a APR marcada como deletada
   *
   * @throws {Error} Se a APR não for encontrada
   */
  async delete(id: number, userId: string): Promise<Apr> {
    return this.repoConcrete.delete(id, userId);
  }

  /**
   * Busca uma APR por ID
   *
   * Retorna apenas APRs ativas (não deletadas).
   *
   * @param id - ID da APR a ser buscada
   * @returns Promise com a APR encontrada ou null
   */
  async getById(id: number): Promise<Apr | null> {
    return this.repoConcrete.findById(id);
  }

  /**
   * Lista APRs com paginação e filtros
   *
   * Busca APRs aplicando filtros, ordenação e paginação.
   * Transforma o resultado do repository para formato padronizado.
   *
   * @param params - Parâmetros de filtro, paginação e ordenação
   * @returns Promise com resultado paginado
   *
   * @example
   * ```typescript
   * const result = await service.list({
   *   page: 1,
   *   pageSize: 10,
   *   orderBy: 'nome',
   *   orderDir: 'asc',
   *   search: 'Soldagem'
   * });
   *
   * console.log(`Encontradas ${result.total} APRs`);
   * console.log(`Página ${result.page} de ${result.totalPages}`);
   * ```
   */
  async list(params: AprFilter): Promise<PaginatedResult<Apr>> {
    // Busca dados via repository
    const { items, total } = await this.repoConcrete.list(params);

    // Transforma para formato padronizado de resposta
    return {
      data: items,
      total,
      totalPages: Math.ceil(total / params.pageSize),
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  /**
   * Define campos pesquisáveis para busca textual
   *
   * Especifica quais campos podem ser usados na busca
   * por texto livre implementada no AbstractCrudService.
   *
   * @returns Array com nomes dos campos pesquisáveis
   */
  protected getSearchFields(): string[] {
    return ['nome'];
  }
}
