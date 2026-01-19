/**
 * Serviço de Checklist
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos checklists de segurança, incluindo CRUD completo,
 * validações e rotinas de sincronização para clientes mobile.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de checklists
 * - Validações de regras de negócio
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com busca e filtro por tipo
 * - Criação com validação de duplicatas
 * - Atualização com auditoria e validação de relacionamentos
 * - Soft delete com preservação de dados
 * - Sincronização completa para mobile (perguntas, opções e vínculos)
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
 * // Listar checklists com paginação
 * const result = await checklistService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'partida',
 *   tipoChecklistId: 3,
 * });
 *
 * // Sincronizar para mobile (ChecklistSyncController via ChecklistSyncService)
 * const modelos = await checklistSyncService.findAllForSync();
 * const perguntas = await checklistSyncService.findAllPerguntasForSync();
 * ```
 */

import { ERROR_MESSAGES, ORDER_CONFIG } from '@common/constants/checklist';
import { handleCrudError } from '@common/utils/error-handler';
import {
  buildPagination,
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import { validateId, validateOptionalId } from '@common/utils/validation';
import { buildWhereClause as buildWhereClauseHelper } from '@common/utils/where-clause';
import { DatabaseService } from '@database/database.service';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ChecklistListResponseDto, ChecklistResponseDto } from '../dto';

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
  /** Filtro por tipo de checklist */
  tipoChecklistId?: number;
  /** Incluir campos de auditoria na resposta */
  includeAudit?: boolean;
}

/**
 * Serviço de Checklist
 *
 * Implementa listagem e contagem de checklists. Criação, atualização e exclusão
 * são feitas no web. Sincronização para mobile em ChecklistSyncService.
 */
@Injectable()
export class ChecklistService {
  private readonly logger = new Logger(ChecklistService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Constrói cláusula WHERE para consultas
   * @private
   */
  private buildWhereClause(search?: string, tipoChecklistId?: number) {
    return buildWhereClauseHelper({
      search,
      searchFields: { nome: true },
      additionalFilters: tipoChecklistId ? { tipoChecklistId } : undefined,
    });
  }

  /**
   * Lista todos os checklists com paginação e busca
   */
  async findAll(params: FindAllParams): Promise<ChecklistListResponseDto> {
    const { page, limit, search, tipoChecklistId } = params;

    this.logger.log(
      `Buscando checklists - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, TipoChecklist: ${tipoChecklistId ?? 'Todos'}`
    );

    // Validar parâmetros
    validatePaginationParams(page, limit);
    validateOptionalId(tipoChecklistId, 'ID do tipo de checklist');

    try {
      // Construir filtros de busca
      const whereClause = this.buildWhereClause(search, tipoChecklistId);

      // Calcular paginação via util compartilhado
      const {
        skip,
        take,
        page: currPage,
        pageSize,
      } = buildPagination({ page, pageSize: limit });

      // Executar consultas em paralelo para otimização
      const [data, total] = await Promise.all([
        this.db.getPrisma().checklist.findMany({
          where: whereClause,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip,
          take,
          select: {
            id: true,
            nome: true,
            tipoChecklistId: true,
            tipoChecklist: {
              select: {
                id: true,
                nome: true,
              },
            },
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        }),
        this.db.getPrisma().checklist.count({
          where: whereClause,
        }),
      ]);

      const meta = buildPaginationMeta(total, currPage, pageSize);
      const result: ChecklistListResponseDto = {
        data: data as ChecklistResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };

      this.logger.log(
        `Encontrados ${total} checklists (${data.length} nesta página)`
      );
      return result;
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'checklists');
    }
  }

  /**
   * Busca checklist por ID
   */
  async findOne(id: number): Promise<ChecklistResponseDto> {
    this.logger.log(`Buscando checklist por ID: ${id}`);

    validateId(id, 'ID do checklist');

    try {
      const checklist = await this.db.getPrisma().checklist.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          nome: true,
          tipoChecklistId: true,
          tipoChecklist: {
            select: {
              id: true,
              nome: true,
            },
          },
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      if (!checklist) {
        this.logger.warn(`Checklist não encontrado: ${id}`);
        throw new NotFoundException(
          `${ERROR_MESSAGES.CHECKLIST_NOT_FOUND} com ID ${id}`
        );
      }

      this.logger.log(`Checklist encontrado: ${checklist.nome} (ID: ${id})`);
      return checklist as ChecklistResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'checklist');
    }
  }

  /**
   * Conta total de checklists ativos
   */
  async count(): Promise<number> {
    this.logger.log('Contando checklists ativos');

    try {
      const count = await this.db.getPrisma().checklist.count({
        where: { deletedAt: null },
      });

      this.logger.log(`Total de checklists ativos: ${count}`);
      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'checklists');
    }
  }
}
