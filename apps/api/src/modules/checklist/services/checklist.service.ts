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
 * // Criar novo checklist
 * const checklist = await checklistService.create({
 *   nome: 'Checklist Pré-Partida',
 *   tipoChecklistId: 3,
 * });
 *
 * // Sincronizar dados para mobile
 * const modelos = await checklistService.findAllForSync();
 * const perguntas = await checklistService.findAllPerguntasForSync();
 * ```
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import {
  ChecklistListResponseDto,
  ChecklistOpcaoRespostaRelacaoSyncDto,
  ChecklistOpcaoRespostaSyncDto,
  ChecklistPerguntaRelacaoSyncDto,
  ChecklistPerguntaSyncDto,
  ChecklistResponseDto,
  ChecklistTipoEquipeRelacaoSyncDto,
  ChecklistTipoVeiculoRelacaoSyncDto,
  CreateChecklistDto,
  UpdateChecklistDto,
} from '../dto';
import {
  buildPagination,
  buildPagedResponse,
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import { buildWhereClause as buildWhereClauseHelper } from '@common/utils/where-clause';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import {
  AUDIT_CONFIG,
  ERROR_MESSAGES,
  CHECKLIST_ORDER_CONFIG_COMPAT,
  ORDER_CONFIG,
} from '../constants/checklist.constants';

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
 * Serviço de Checklist
 *
 * Implementa toda a lógica de negócio para gerenciamento
 * de checklists de segurança com validações e auditoria completas.
 */
@Injectable()
export class ChecklistService {
  private readonly logger = new Logger(ChecklistService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Valida ID de checklist
   * @private
   */
  private validateChecklistId(id: number): void {
    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_ID);
    }
  }

  /**
   * Valida ID de tipo de checklist
   * @private
   */
  private validateTipoChecklistId(tipoChecklistId?: number): void {
    if (
      tipoChecklistId !== undefined &&
      (!Number.isInteger(tipoChecklistId) || tipoChecklistId <= 0)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_TIPO_CHECKLIST_ID);
    }
  }

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
    this.validateTipoChecklistId(tipoChecklistId);

    try {
      // Construir filtros de busca
      const whereClause = this.buildWhereClause(search, tipoChecklistId);

      // Calcular paginação via util compartilhado
      const { skip, take, page: currPage, pageSize } = buildPagination({ page, pageSize: limit });

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
      this.logger.error('Erro ao buscar checklists:', error);
      throw new BadRequestException('Erro ao buscar checklists');
    }
  }

  /**
   * Lista todos os checklists ativos para sincronização
   */
  async findAllForSync(): Promise<ChecklistResponseDto[]> {
    this.logger.log('Sincronizando checklists - retorno completo');

    try {
      const data = await this.db.getPrisma().checklist.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: ORDER_CONFIG.SYNC_ORDER,
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

      this.logger.log(
        `Sincronização de checklists retornou ${data.length} registros`
      );
      return data as ChecklistResponseDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar checklists:', error);
      throw new BadRequestException('Erro ao sincronizar checklists');
    }
  }

  /**
   * Lista todas as perguntas de checklist para sincronização
   */
  async findAllPerguntasForSync(): Promise<ChecklistPerguntaSyncDto[]> {
    this.logger.log('Sincronizando perguntas de checklist');

    try {
      const data = await this.db.getPrisma().checklistPergunta.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de perguntas retornou ${data.length} registros`
      );
      return data as ChecklistPerguntaSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar perguntas de checklist:', error);
      throw new BadRequestException(
        'Erro ao sincronizar perguntas de checklist'
      );
    }
  }

  /**
   * Lista todas as relações checklist-perguntas para sincronização
   */
  async findAllPerguntaRelacoesForSync(): Promise<
    ChecklistPerguntaRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações Checklist-Perguntas');

    try {
      const data = await this.db.getPrisma().checklistPerguntaRelacao.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.PERGUNTA_RELACAO_ORDER,
        select: {
          id: true,
          checklistId: true,
          checklistPerguntaId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de relações Checklist-Perguntas retornou ${data.length} registros`
      );
      return data as ChecklistPerguntaRelacaoSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar relações Checklist-Perguntas:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar relações entre checklists e perguntas'
      );
    }
  }

  /**
   * Lista todas as opções de resposta de checklist para sincronização
   */
  async findAllOpcoesForSync(): Promise<ChecklistOpcaoRespostaSyncDto[]> {
    this.logger.log('Sincronizando opções de resposta de checklist');

    try {
      const data = await this.db.getPrisma().checklistOpcaoResposta.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          geraPendencia: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de opções de resposta retornou ${data.length} registros`
      );
      return data as ChecklistOpcaoRespostaSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar opções de resposta de checklist:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar opções de resposta de checklist'
      );
    }
  }

  /**
   * Lista todas as relações checklist-opções para sincronização
   */
  async findAllOpcaoRelacoesForSync(): Promise<
    ChecklistOpcaoRespostaRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações Checklist-Opções de resposta');

    try {
      const data = await this.db
        .getPrisma()
        .checklistOpcaoRespostaRelacao.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.OPCAO_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            checklistOpcaoRespostaId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });

      this.logger.log(
        `Sincronização de relações Checklist-Opções retornou ${data.length} registros`
      );
      return data as ChecklistOpcaoRespostaRelacaoSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar relações Checklist-Opções de resposta:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar relações entre checklists e opções de resposta'
      );
    }
  }

  /**
   * Lista todas as relações checklist-tipo de veículo para sincronização
   */
  async findAllTipoVeiculoRelacoesForSync(): Promise<
    ChecklistTipoVeiculoRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações Checklist-Tipo de Veículo');

    try {
      const data = await this.db
        .getPrisma()
        .checklistTipoVeiculoRelacao.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.TIPO_VEICULO_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            tipoVeiculoId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });

      this.logger.log(
        `Sincronização de relações Checklist-Tipo de Veículo retornou ${data.length} registros`
      );
      return data as ChecklistTipoVeiculoRelacaoSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar relações Checklist-Tipo de Veículo:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar relações entre checklists e tipos de veículo'
      );
    }
  }

  /**
   * Lista todas as relações checklist-tipo de equipe para sincronização
   */
  async findAllTipoEquipeRelacoesForSync(): Promise<
    ChecklistTipoEquipeRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações Checklist-Tipo de Equipe');

    try {
      const data = await this.db
        .getPrisma()
        .checklistTipoEquipeRelacao.findMany({
          where: {
            deletedAt: null,
          },
          orderBy: CHECKLIST_ORDER_CONFIG_COMPAT.TIPO_EQUIPE_RELACAO_ORDER,
          select: {
            id: true,
            checklistId: true,
            tipoEquipeId: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        });

      this.logger.log(
        `Sincronização de relações Checklist-Tipo de Equipe retornou ${data.length} registros`
      );
      return data as ChecklistTipoEquipeRelacaoSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar relações Checklist-Tipo de Equipe:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar relações entre checklists e tipos de equipe'
      );
    }
  }

  /**
   * Busca checklist por ID
   */
  async findOne(id: number): Promise<ChecklistResponseDto> {
    this.logger.log(`Buscando checklist por ID: ${id}`);

    this.validateChecklistId(id);

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar checklist ${id}:`, error);
      throw new BadRequestException('Erro ao buscar checklist');
    }
  }

  /**
   * Cria novo checklist
   */
  async create(
    createChecklistDto: CreateChecklistDto,
    userId?: string
  ): Promise<ChecklistResponseDto> {
    const { nome, tipoChecklistId } = createChecklistDto;
    const userContext = this.getCurrentUserContext(userId);

    this.logger.log(
      `Criando novo checklist: ${nome} (Tipo: ${tipoChecklistId})`
    );

    this.validateTipoChecklistId(tipoChecklistId);

    try {
      const existingChecklist = await this.db.getPrisma().checklist.findFirst({
        where: {
          nome: nome.trim(),
          deletedAt: null,
        },
      });

      if (existingChecklist) {
        this.logger.warn(`Tentativa de criar checklist duplicado: ${nome}`);
        throw new ConflictException(ERROR_MESSAGES.CHECKLIST_DUPLICATE);
      }

      const tipoChecklist = await this.db.getPrisma().tipoChecklist.findFirst({
        where: {
          id: tipoChecklistId,
          deletedAt: null,
        },
        select: {
          id: true,
          nome: true,
        },
      });

      if (!tipoChecklist) {
        this.logger.warn(
          `Tipo de checklist não encontrado para criação: ${tipoChecklistId}`
        );
        throw new NotFoundException(ERROR_MESSAGES.TIPO_CHECKLIST_NOT_FOUND);
      }

      const checklist = await this.db.getPrisma().checklist.create({
        data: {
          nome: nome.trim(),
          tipoChecklist: { connect: { id: tipoChecklistId } },
          createdAt: new Date(),
          createdBy: userContext.userId,
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

      this.logger.log(
        `Checklist criado com sucesso - ID: ${checklist.id}, Nome: ${checklist.nome}`
      );
      return checklist as ChecklistResponseDto;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error('Erro ao criar checklist:', error);
      throw new BadRequestException('Erro ao criar checklist');
    }
  }

  /**
   * Atualiza checklist existente
   */
  async update(
    id: number,
    updateChecklistDto: UpdateChecklistDto,
    userId?: string
  ): Promise<ChecklistResponseDto> {
    const { nome, tipoChecklistId } = updateChecklistDto;
    const userContext = this.getCurrentUserContext(userId);

    this.logger.log(
      `Atualizando checklist ${id}: Nome=${nome || 'N/A'}, Tipo=${
        tipoChecklistId ?? 'N/A'
      }`
    );

    this.validateChecklistId(id);
    this.validateTipoChecklistId(tipoChecklistId);

    try {
      const existingChecklist = await this.db.getPrisma().checklist.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingChecklist) {
        this.logger.warn(`Tentativa de atualizar checklist inexistente: ${id}`);
        throw new NotFoundException(
          `${ERROR_MESSAGES.CHECKLIST_NOT_FOUND} com ID ${id}`
        );
      }

      if (nome && nome.trim() !== existingChecklist.nome) {
        const duplicateChecklist = await this.db
          .getPrisma()
          .checklist.findFirst({
            where: {
              nome: nome.trim(),
              deletedAt: null,
              NOT: { id },
            },
          });

        if (duplicateChecklist) {
          this.logger.warn(
            `Tentativa de atualizar checklist com nome duplicado: ${nome}`
          );
          throw new ConflictException(ERROR_MESSAGES.CHECKLIST_DUPLICATE);
        }
      }

      if (tipoChecklistId) {
        const tipoChecklist = await this.db
          .getPrisma()
          .tipoChecklist.findFirst({
            where: {
              id: tipoChecklistId,
              deletedAt: null,
            },
            select: { id: true },
          });

        if (!tipoChecklist) {
          this.logger.warn(
            `Tipo de checklist não encontrado para atualização: ${tipoChecklistId}`
          );
          throw new NotFoundException(ERROR_MESSAGES.TIPO_CHECKLIST_NOT_FOUND);
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: userContext.userId,
      };

      if (nome) {
        updateData.nome = nome.trim();
      }

      if (tipoChecklistId) {
        updateData.tipoChecklist = {
          connect: { id: tipoChecklistId },
        };
      }

      const checklist = await this.db.getPrisma().checklist.update({
        where: { id },
        data: updateData,
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

      this.logger.log(`Checklist ${id} atualizado com sucesso`);
      return checklist as ChecklistResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar checklist ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar checklist');
    }
  }

  /**
   * Remove checklist (soft delete)
   */
  async remove(id: number, userId?: string): Promise<void> {
    this.logger.log(`Removendo checklist: ${id}`);
    const userContext = this.getCurrentUserContext(userId);

    this.validateChecklistId(id);

    try {
      const existingChecklist = await this.db.getPrisma().checklist.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingChecklist) {
        this.logger.warn(`Tentativa de remover checklist inexistente: ${id}`);
        throw new NotFoundException(
          `${ERROR_MESSAGES.CHECKLIST_NOT_FOUND} com ID ${id}`
        );
      }

      await this.db.getPrisma().checklist.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userContext.userId,
        },
      });

      this.logger.log(`Checklist ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao remover checklist ${id}:`, error);
      throw new BadRequestException('Erro ao remover checklist');
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
      this.logger.error('Erro ao contar checklists:', error);
      throw new BadRequestException('Erro ao contar checklists');
    }
  }
}
