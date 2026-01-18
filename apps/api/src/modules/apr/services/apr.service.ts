/**
 * Serviço de APR (Análise Preliminar de Risco)
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos modelos de APR, incluindo CRUD completo e validações.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de modelos APR
 * - Validações de regras de negócio
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com busca (para AprController)
 * - Criação com validação de duplicatas
 * - Atualização com auditoria
 * - Soft delete com preservação de dados
 * - Busca por ID com relacionamentos
 * - Contagem e estatísticas
 * - Sincronização completa para mobile (para AprSyncController)
 * - Sincronização de perguntas, opções e relações
 *
 * PADRÕES IMPLEMENTADOS:
 * - Injeção de dependência
 * - Logging estruturado
 * - Tratamento de exceções
 * - Transformação de DTOs
 * - Validações de negócio
 * - Auditoria automática
 *
 * @example
 * ```typescript
 * // Listar modelos com paginação (AprController)
 * const result = await aprService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'soldagem'
 * });
 *
 * // Criar novo modelo (AprController)
 * const apr = await aprService.create({
 *   nome: 'APR Soldagem Industrial'
 * });
 *
 * // Sincronizar para mobile (AprSyncController via AprSyncService)
 * const modelos = await aprSyncService.findAllForSync();
 * const perguntas = await aprSyncService.findAllPerguntasForSync();
 * ```
 */

import {
  AUDIT_CONFIG,
  ERROR_MESSAGES,
  ORDER_CONFIG,
} from '@common/constants/apr';
import { handleCrudError } from '@common/utils/error-handler';
import {
  validatePaginationParams,
  buildPaginationMeta,
} from '@common/utils/pagination';
import { validateId } from '@common/utils/validation';
import { buildWhereClause as buildWhereClauseHelper } from '@common/utils/where-clause';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { AprListResponseDto, AprResponseDto } from '../dto';

/**
 * Interface para parâmetros de consulta interna
 */
interface FindAllParams {
  /** Número da página */
  page: number;
  /** Limite de itens por página */
  limit: number;
  /** Termo de busca */
  search?: string;
  /** Incluir campos de auditoria na resposta */
  includeAudit?: boolean;
}

/**
 * Interface para contexto de usuário (futura implementação)
 */
interface UserContext {
  /** ID do usuário */
  userId: string;
  /** Nome do usuário */
  userName: string;
  /** Roles do usuário */
  roles: string[];
}

/**
 * Serviço de APR (Análise Preliminar de Risco)
 *
 * Implementa toda a lógica de negócio para gerenciamento
 * de modelos de APR com validações e auditoria completas.
 */
@Injectable()
export class AprService {
  private readonly logger = new Logger(AprService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Valida ID de modelo APR
   * @private
   */

  /**
   * Obtém contexto do usuário atual
   * @private
   * @param userId - ID do usuário (opcional, usa 'system' como fallback)
   */
  private getCurrentUserContext(userId?: string): UserContext {
    if (userId) {
      return {
        userId,
        userName: userId,
        roles: [],
      };
    }
    return {
      userId: AUDIT_CONFIG.DEFAULT_USER,
      userName: AUDIT_CONFIG.DEFAULT_USER_NAME,
      roles: AUDIT_CONFIG.DEFAULT_ROLES,
    };
  }

  /**
   * Constrói cláusula WHERE para consultas
   * @private
   */
  private buildWhereClause(search?: string) {
    return buildWhereClauseHelper({
      search,
      searchFields: { nome: true },
    });
  }

  /**
   * Lista todos os modelos de APR com paginação e busca
   *
   * Retorna uma lista paginada de modelos APR aplicando filtros
   * de busca por nome e ordenação por data de criação.
   *
   * @param params - Parâmetros de consulta (página, limite, busca)
   * @returns Lista paginada de modelos APR
   *
   * @throws {BadRequestException} Se os parâmetros forem inválidos
   *
   * @example
   * ```typescript
   * const result = await aprService.findAll({
   *   page: 1,
   *   limit: 10,
   *   search: 'soldagem'
   * });
   *
   * console.log(`Encontrados ${result.meta.total} modelos`);
   * ```
   */
  async findAll(params: FindAllParams): Promise<AprListResponseDto> {
    const { page, limit, search } = params;

    this.logger.log(
      `Buscando modelos APR - Página: ${page}, Limite: ${limit}, Busca: ${search || 'N/A'}`
    );

    // Validar parâmetros
    validatePaginationParams(page, limit);

    try {
      // Construir filtros de busca
      const whereClause = this.buildWhereClause(search);

      // Calcular offset para paginação
      const skip = (page - 1) * limit;

      // Executar consultas em paralelo para otimização
      const [data, total] = await Promise.all([
        // Buscar dados paginados
        this.db.getPrisma().apr.findMany({
          where: whereClause,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip,
          take: limit,
          select: {
            id: true,
            nome: true,
            // Campos de auditoria excluídos por padrão para melhor performance
            // e resposta mais limpa. Podem ser incluídos via parâmetro se necessário.
          },
        }),

        // Contar total de registros
        this.db.getPrisma().apr.count({
          where: whereClause,
        }),
      ]);

      // Construir metadados de paginação
      const meta = buildPaginationMeta(total, page, limit);

      const result: AprListResponseDto = {
        data: data as AprResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };

      this.logger.log(
        `Encontrados ${total} modelos APR (${data.length} nesta página)`
      );
      return result;
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'modelos APR');
    }
  }

  /**
   * Busca modelo de APR por ID
   *
   * Retorna um modelo específico de APR baseado no ID fornecido,
   * incluindo validação de existência e status ativo.
   *
   * @param id - ID único do modelo APR
   * @returns Modelo APR encontrado
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {BadRequestException} Se o ID for inválido
   *
   * @example
   * ```typescript
   * const apr = await aprService.findOne(1);
   * console.log(`Modelo encontrado: ${apr.nome}`);
   * ```
   */
  async findOne(id: number): Promise<AprResponseDto> {
    this.logger.log(`Buscando modelo APR por ID: ${id}`);

    // Validar ID
    validateId(id, 'ID da APR');

    try {
      const apr = await this.db.getPrisma().apr.findFirst({
        where: {
          id,
          deletedAt: null, // Apenas registros ativos
        },
        select: {
          id: true,
          nome: true,
          // Campos de auditoria excluídos por padrão para resposta mais limpa
        },
      });

      if (!apr) {
        this.logger.warn(`Modelo APR não encontrado: ${id}`);
        throw new NotFoundException(
          `${ERROR_MESSAGES.APR_NOT_FOUND} com ID ${id}`
        );
      }

      this.logger.log(`Modelo APR encontrado: ${apr.nome} (ID: ${id})`);
      return apr as AprResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'modelo APR');
    }
  }

  /**
   * Conta total de modelos APR ativos
   *
   * Retorna o número total de modelos APR ativos no sistema.
   *
   * @returns Número total de modelos ativos
   *
   * @example
   * ```typescript
   * const total = await aprService.count();
   * console.log(`Total de modelos APR: ${total}`);
   * ```
   */
  async count(): Promise<number> {
    this.logger.log('Contando modelos APR ativos');

    try {
      const count = await this.db.getPrisma().apr.count({
        where: { deletedAt: null },
      });

      this.logger.log(`Total de modelos APR ativos: ${count}`);
      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'modelos APR');
    }
  }
}
