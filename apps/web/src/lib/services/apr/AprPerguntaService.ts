/**
 * Service para APR Pergunta
 *
 * Implementa a camada de serviço para a entidade AprPergunta,
 * contendo a lógica de negócio e validações específicas.
 * Atua como intermediário entre Controllers/Actions e Repository.
 *
 * RESPONSABILIDADES:
 * - Lógica de negócio específica de APR Pergunta
 * - Validação de dados usando Zod schemas
 * - Transformação de dados entre camadas
 * - Orquestração de operações complexas
 * - Integração com Repository para persistência
 * - Herança do AbstractCrudService
 *
 * FUNCIONALIDADES:
 * - create(): Criação com validação de negócio
 * - update(): Atualização com regras específicas
 * - delete(): Exclusão com verificações
 * - getById(): Busca individual
 * - list(): Listagem paginada com transformações
 * - Validações automáticas via Zod
 * - Type safety completo
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - Nome obrigatório (1-255 caracteres)
 * - Dados de entrada via schema Zod
 * - Transformações de tipo automáticas
 * - Tratamento de erros padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const service = new AprPerguntaService();
 *
 * // Criar pergunta com validação
 * const pergunta = await service.create({
 *   nome: "Você verificou os EPIs?"
 * }, "user123");
 *
 * // Listar com paginação
 * const result = await service.list({
 *   page: 1,
 *   pageSize: 10,
 *   orderBy: 'nome',
 *   orderDir: 'asc'
 * });
 * ```
 */

import { AprPergunta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AprPerguntaRepository } from '../../repositories/apr/AprPerguntaRepository';
import {
    aprPerguntaCreateSchema,
    aprPerguntaFilterSchema,
    aprPerguntaUpdateSchema,
} from '../../schemas/aprPerguntaSchema';
import { PaginatedResult } from '../../types/common';

// Tipos derivados dos schemas Zod para type safety
type AprPerguntaCreate = z.infer<typeof aprPerguntaCreateSchema>;
type AprPerguntaUpdate = z.infer<typeof aprPerguntaUpdateSchema>;
type AprPerguntaFilter = z.infer<typeof aprPerguntaFilterSchema>;

/**
 * Service para operações de negócio com APR Pergunta
 *
 * Herda funcionalidades básicas do AbstractCrudService
 * e implementa lógica específica da entidade AprPergunta.
 */
export class AprPerguntaService extends AbstractCrudService<
  AprPerguntaCreate,
  AprPerguntaUpdate,
  AprPerguntaFilter,
  AprPergunta
> {
  /** Referência concreta ao repository para operações específicas */
  private repoConcrete: AprPerguntaRepository;

  /**
   * Construtor do service
   *
   * Inicializa o repository concreto e configura a herança
   * do AbstractCrudService para funcionalidades básicas.
   */
  constructor() {
    const repo = new AprPerguntaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  /**
   * Cria uma nova pergunta APR
   *
   * Aplica validações de negócio, transforma os dados
   * e delega a persistência para o repository.
   *
   * @param data - Dados validados da pergunta
   * @param userId - ID do usuário que está criando
   * @returns Promise com a pergunta criada
   *
   * @throws {Error} Se os dados forem inválidos
   * @throws {Error} Se houver erro na persistência
   *
   * @example
   * ```typescript
   * const pergunta = await service.create({
   *   nome: "Você verificou a área de trabalho?"
   * }, "user123");
   * ```
   */
  async create(data: any, userId: string): Promise<AprPergunta> {
    // Extrai campos de auditoria adicionados pelo handleServerAction
    const { createdBy, createdAt, ...businessData } = data;

    // Reconstrói objeto com dados de negócio + auditoria
    return this.repoConcrete.create(
      {
        ...businessData,
        ...(createdBy && { createdBy }),
        ...(createdAt && { createdAt }),
      },
      userId
    );
  }

  /**
   * Atualiza uma pergunta APR existente
   *
   * Extrai o ID dos dados, aplica validações de negócio
   * e delega a atualização para o repository.
   *
   * @param data - Dados validados incluindo ID
   * @param userId - ID do usuário que está atualizando
   * @returns Promise com a pergunta atualizada
   *
   * @throws {Error} Se a pergunta não for encontrada
   * @throws {Error} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const pergunta = await service.update({
   *   id: 1,
   *   nome: "Você verificou todos os EPIs necessários?"
   * }, "user123");
   * ```
   */
  async update(data: AprPerguntaUpdate, userId: string): Promise<AprPergunta> {
    // Extrai o ID e separa os dados de atualização
    const { id, ...updateData } = data;

    return this.repoConcrete.update(id, updateData, userId);
  }

  /**
   * Exclui uma pergunta APR (soft delete)
   *
   * Realiza soft delete marcando a pergunta como deletada
   * sem remover fisicamente do banco de dados.
   *
   * @param id - ID da pergunta a ser excluída
   * @param userId - ID do usuário que está excluindo
   * @returns Promise com a pergunta marcada como deletada
   *
   * @throws {Error} Se a pergunta não for encontrada
   *
   * @example
   * ```typescript
   * const pergunta = await service.delete(1, "user123");
   * ```
   */
  async delete(id: number, userId: string): Promise<AprPergunta> {
    return this.repoConcrete.delete(id, userId);
  }

  /**
   * Busca uma pergunta APR por ID
   *
   * Retorna apenas perguntas ativas (não deletadas).
   *
   * @param id - ID da pergunta a ser buscada
   * @returns Promise com a pergunta encontrada ou null
   *
   * @example
   * ```typescript
   * const pergunta = await service.getById(1);
   * if (pergunta) {
   *   console.log(pergunta.nome);
   * }
   * ```
   */
  async getById(id: number): Promise<AprPergunta | null> {
    return this.repoConcrete.findById(id);
  }

  /**
   * Lista perguntas APR com paginação e filtros
   *
   * Busca perguntas aplicando filtros, ordenação e paginação.
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
   *   search: 'EPI'
   * });
   *
   * console.log(`Encontradas ${result.total} perguntas`);
   * console.log(`Página ${result.page} de ${result.totalPages}`);
   * ```
   */
  async list(params: AprPerguntaFilter): Promise<PaginatedResult<AprPergunta>> {
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
