/**
 * Service para APR Opção de Resposta
 *
 * Implementa a camada de serviço para a entidade AprOpcaoResposta,
 * contendo a lógica de negócio e validações específicas.
 * Atua como intermediário entre Controllers/Actions e Repository.
 *
 * RESPONSABILIDADES:
 * - Lógica de negócio específica de APR Opção de Resposta
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
 * - geraPendencia boolean opcional (padrão: false)
 * - Dados de entrada via schema Zod
 * - Transformações de tipo automáticas
 * - Tratamento de erros padronizado
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const service = new AprOpcaoRespostaService();
 *
 * // Criar opção de resposta com validação
 * const opcao = await service.create({
 *   nome: "Não Conforme",
 *   geraPendencia: true
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

import { AprOpcaoResposta } from '@nexa-oper/db';
import { z } from 'zod';
import { AbstractCrudService } from '../../abstracts/AbstractCrudService';
import { AprOpcaoRespostaRepository } from '../../repositories/apr/AprOpcaoRespostaRepository';
import {
  aprOpcaoRespostaCreateSchema,
  aprOpcaoRespostaFilterSchema,
  aprOpcaoRespostaUpdateSchema,
} from '../../schemas/aprOpcaoRespostaSchema';
import { PaginatedResult } from '../../types/common';

// Tipos derivados dos schemas Zod para type safety
type AprOpcaoRespostaCreate = z.infer<typeof aprOpcaoRespostaCreateSchema>;
type AprOpcaoRespostaUpdate = z.infer<typeof aprOpcaoRespostaUpdateSchema>;
type AprOpcaoRespostaFilter = z.infer<typeof aprOpcaoRespostaFilterSchema>;

/**
 * Service para operações de negócio com APR Opção de Resposta
 *
 * Herda funcionalidades básicas do AbstractCrudService
 * e implementa lógica específica da entidade AprOpcaoResposta.
 */
export class AprOpcaoRespostaService extends AbstractCrudService<
  AprOpcaoRespostaCreate,
  AprOpcaoRespostaUpdate,
  AprOpcaoRespostaFilter,
  AprOpcaoResposta
> {
  /** Referência concreta ao repository para operações específicas */
  private repoConcrete: AprOpcaoRespostaRepository;

  /**
   * Construtor do service
   *
   * Inicializa o repository concreto e configura a herança
   * do AbstractCrudService para funcionalidades básicas.
   */
  constructor() {
    const repo = new AprOpcaoRespostaRepository();
    super(repo);
    this.repoConcrete = repo;
  }

  /**
   * Cria uma nova opção de resposta APR
   *
   * Aplica validações de negócio, transforma os dados
   * e delega a persistência para o repository.
   *
   * @param data - Dados validados da opção de resposta
   * @param userId - ID do usuário que está criando
   * @returns Promise com a opção de resposta criada
   *
   * @throws {Error} Se os dados forem inválidos
   * @throws {Error} Se houver erro na persistência
   *
   * @example
   * ```typescript
   * const opcao = await service.create({
   *   nome: "Não Conforme",
   *   geraPendencia: true
   * }, "user123");
   * ```
   */
  async create(data: any, userId: string): Promise<AprOpcaoResposta> {
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
   * Atualiza uma opção de resposta APR existente
   *
   * Extrai o ID dos dados, aplica validações de negócio
   * e delega a atualização para o repository.
   *
   * @param data - Dados validados incluindo ID
   * @param userId - ID do usuário que está atualizando
   * @returns Promise com a opção de resposta atualizada
   *
   * @throws {Error} Se a opção de resposta não for encontrada
   * @throws {Error} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const opcao = await service.update({
   *   id: 1,
   *   nome: "Parcialmente Conforme",
   *   geraPendencia: false
   * }, "user123");
   * ```
   */
  async update(
    data: AprOpcaoRespostaUpdate,
    userId: string
  ): Promise<AprOpcaoResposta> {
    // Extrai o ID e separa os dados de atualização
    const { id, ...updateData } = data;

    return this.repoConcrete.update(id, updateData, userId);
  }

  // delete, getById, list vêm da classe abstrata

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
