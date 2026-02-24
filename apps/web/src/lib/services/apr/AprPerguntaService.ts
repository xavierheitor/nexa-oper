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
