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
 * // Sincronizar para mobile (AprSyncController)
 * const modelos = await aprService.findAllForSync();
 * const perguntas = await aprService.findAllPerguntasForSync();
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
  AprListResponseDto,
  AprResponseDto,
  AprOpcaoRespostaRelacaoSyncDto,
  AprOpcaoRespostaSyncDto,
  AprPerguntaRelacaoSyncDto,
  AprPerguntaSyncDto,
  AprTipoAtividadeRelacaoSyncDto,
  CreateAprDto,
  UpdateAprDto,
} from '../dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import {
  PAGINATION_CONFIG,
  AUDIT_CONFIG,
  ERROR_MESSAGES,
  APR_ORDER_CONFIG_COMPAT,
  ORDER_CONFIG,
} from '../constants/apr.constants';

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
   * Valida parâmetros de paginação
   * @private
   */
  private validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PAGE);
    }
    if (limit < 1 || limit > PAGINATION_CONFIG.MAX_LIMIT) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_LIMIT);
    }
  }

  /**
   * Valida ID de modelo APR
   * @private
   */
  private validateAprId(id: number): void {
    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_ID);
    }
  }

  /**
   * Obtém contexto do usuário atual (placeholder para futura implementação)
   * @private
   */
  private getCurrentUserContext(): UserContext {
    // TODO: Implementar extração do contexto do usuário do JWT
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
    return {
      deletedAt: null, // Apenas registros ativos
      ...(search && {
        nome: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };
  }

  /**
   * Constrói metadados de paginação
   * @private
   */
  private buildPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
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
    this.validatePaginationParams(page, limit);

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
      const meta = this.buildPaginationMeta(total, page, limit);

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
      this.logger.error('Erro ao buscar modelos APR:', error);
      throw new BadRequestException('Erro ao buscar modelos APR');
    }
  }

  /**
   * Lista todos os modelos APR ativos para sincronização
   *
   * Retorna todos os modelos ativos sem paginação para permitir
   * que clientes mobile mantenham seus dados em sincronia.
   *
   * @returns Lista completa de modelos APR ativos
   */
  async findAllForSync(): Promise<AprResponseDto[]> {
    this.logger.log('Sincronizando modelos APR - retorno completo');

    try {
      const data = await this.db.getPrisma().apr.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de modelos APR retornou ${data.length} registros`
      );
      return data as AprResponseDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar modelos APR:', error);
      throw new BadRequestException('Erro ao sincronizar modelos APR');
    }
  }

  /**
   * Lista todas as perguntas APR para sincronização
   */
  async findAllPerguntasForSync(): Promise<AprPerguntaSyncDto[]> {
    this.logger.log('Sincronizando perguntas APR - retorno completo');

    try {
      const data = await this.db.getPrisma().aprPergunta.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de perguntas APR retornou ${data.length} registros`
      );
      return data as AprPerguntaSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar perguntas APR:', error);
      throw new BadRequestException('Erro ao sincronizar perguntas APR');
    }
  }

  /**
   * Lista todas as relações entre APR e perguntas para sincronização
   */
  async findAllPerguntaRelacoesForSync(): Promise<AprPerguntaRelacaoSyncDto[]> {
    this.logger.log('Sincronizando relações APR-Perguntas - retorno completo');

    try {
      const data = await this.db.getPrisma().aprPerguntaRelacao.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: APR_ORDER_CONFIG_COMPAT.PERGUNTA_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          aprPerguntaId: true,
          ordem: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de relações APR-Perguntas retornou ${data.length} registros`
      );
      return data as AprPerguntaRelacaoSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar relações APR-Perguntas:', error);
      throw new BadRequestException(
        'Erro ao sincronizar relações entre APR e perguntas'
      );
    }
  }

  /**
   * Lista todas as opções de resposta APR para sincronização
   */
  async findAllOpcoesForSync(): Promise<AprOpcaoRespostaSyncDto[]> {
    this.logger.log('Sincronizando opções de resposta APR - retorno completo');

    try {
      const data = await this.db.getPrisma().aprOpcaoResposta.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
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
        `Sincronização de opções de resposta APR retornou ${data.length} registros`
      );
      return data as AprOpcaoRespostaSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar opções de resposta APR:', error);
      throw new BadRequestException(
        'Erro ao sincronizar opções de resposta APR'
      );
    }
  }

  /**
   * Lista todas as relações entre APR e opções de resposta para sincronização
   */
  async findAllOpcaoRelacoesForSync(): Promise<
    AprOpcaoRespostaRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações APR-Opções de resposta');

    try {
      const data = await this.db.getPrisma().aprOpcaoRespostaRelacao.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: APR_ORDER_CONFIG_COMPAT.OPCAO_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          aprOpcaoRespostaId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de relações APR-Opções retornou ${data.length} registros`
      );
      return data as AprOpcaoRespostaRelacaoSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar relações APR-Opções:', error);
      throw new BadRequestException(
        'Erro ao sincronizar relações entre APR e opções de resposta'
      );
    }
  }

  /**
   * Lista todas as relações entre APR e tipos de atividade para sincronização
   */
  async findAllTipoAtividadeRelacoesForSync(): Promise<
    AprTipoAtividadeRelacaoSyncDto[]
  > {
    this.logger.log('Sincronizando relações APR-Tipo de Atividade');

    try {
      const data = await this.db.getPrisma().aprTipoAtividadeRelacao.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: APR_ORDER_CONFIG_COMPAT.TIPO_ATIVIDADE_RELACAO_ORDER,
        select: {
          id: true,
          aprId: true,
          tipoAtividadeId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de relações APR-Tipo de Atividade retornou ${data.length} registros`
      );
      return data as AprTipoAtividadeRelacaoSyncDto[];
    } catch (error) {
      this.logger.error(
        'Erro ao sincronizar relações APR-Tipo de Atividade:',
        error
      );
      throw new BadRequestException(
        'Erro ao sincronizar relações entre APR e tipos de atividade'
      );
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
    this.validateAprId(id);

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
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao buscar modelo APR');
    }
  }

  /**
   * Cria novo modelo de APR
   *
   * Cria um novo modelo de APR no sistema com validação
   * de duplicatas por nome e auditoria automática.
   *
   * @param createAprDto - Dados do novo modelo APR
   * @returns Modelo APR criado
   *
   * @throws {ConflictException} Se já existir modelo com o mesmo nome
   * @throws {BadRequestException} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const apr = await aprService.create({
   *   nome: 'APR Soldagem Industrial'
   * });
   *
   * console.log(`Modelo criado com ID: ${apr.id}`);
   * ```
   */
  async create(createAprDto: CreateAprDto): Promise<AprResponseDto> {
    const { nome } = createAprDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(`Criando novo modelo APR: ${nome}`);

    try {
      // Verificar se já existe modelo com o mesmo nome
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: {
          nome: nome.trim(),
          deletedAt: null,
        },
      });

      if (existingApr) {
        this.logger.warn(`Tentativa de criar modelo APR duplicado: ${nome}`);
        throw new ConflictException(
          `${ERROR_MESSAGES.APR_DUPLICATE} "${nome}"`
        );
      }

      // Criar novo modelo APR
      const apr = await this.db.getPrisma().apr.create({
        data: {
          nome: nome.trim(),
          createdAt: new Date(),
          createdBy: userContext.userId,
        },
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
        `Modelo APR criado com sucesso - ID: ${apr.id}, Nome: ${apr.nome}`
      );
      return apr as AprResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Erro ao criar modelo APR:', error);
      throw new BadRequestException('Erro ao criar modelo APR');
    }
  }

  /**
   * Atualiza modelo de APR existente
   *
   * Atualiza um modelo de APR existente com os novos dados,
   * incluindo validação de existência e auditoria.
   *
   * @param id - ID do modelo APR a ser atualizado
   * @param updateAprDto - Novos dados do modelo APR
   * @returns Modelo APR atualizado
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {ConflictException} Se o novo nome já existir
   * @throws {BadRequestException} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const apr = await aprService.update(1, {
   *   nome: 'APR Soldagem Industrial Atualizada'
   * });
   *
   * console.log(`Modelo atualizado: ${apr.nome}`);
   * ```
   */
  async update(
    id: number,
    updateAprDto: UpdateAprDto
  ): Promise<AprResponseDto> {
    const { nome } = updateAprDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(`Atualizando modelo APR ${id}: ${nome || 'N/A'}`);

    // Validar ID
    this.validateAprId(id);

    try {
      // Verificar se o modelo existe
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingApr) {
        this.logger.warn(
          `Tentativa de atualizar modelo APR inexistente: ${id}`
        );
        throw new NotFoundException(
          `${ERROR_MESSAGES.APR_NOT_FOUND} com ID ${id}`
        );
      }

      // Se nome foi fornecido, verificar duplicatas
      if (nome && nome.trim() !== existingApr.nome) {
        const duplicateApr = await this.db.getPrisma().apr.findFirst({
          where: {
            nome: nome.trim(),
            deletedAt: null,
            NOT: { id },
          },
        });

        if (duplicateApr) {
          this.logger.warn(
            `Tentativa de atualizar modelo APR com nome duplicado: ${nome}`
          );
          throw new ConflictException(
            `${ERROR_MESSAGES.APR_DUPLICATE} "${nome}"`
          );
        }
      }

      // Preparar dados de atualização
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: userContext.userId,
      };

      if (nome) {
        updateData.nome = nome.trim();
      }

      // Atualizar modelo APR
      const apr = await this.db.getPrisma().apr.update({
        where: { id },
        data: updateData,
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

      this.logger.log(`Modelo APR ${id} atualizado com sucesso`);
      return apr as AprResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar modelo APR');
    }
  }

  /**
   * Remove modelo de APR (soft delete)
   *
   * Remove logicamente um modelo de APR do sistema,
   * preservando os dados para auditoria e histórico.
   *
   * @param id - ID do modelo APR a ser removido
   * @returns void
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {BadRequestException} Se o ID for inválido
   *
   * @example
   * ```typescript
   * await aprService.remove(1);
   * console.log('Modelo APR removido com sucesso');
   * ```
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`Removendo modelo APR: ${id}`);
    const userContext = this.getCurrentUserContext();

    // Validar ID
    this.validateAprId(id);

    try {
      // Verificar se o modelo existe e está ativo
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingApr) {
        this.logger.warn(`Tentativa de remover modelo APR inexistente: ${id}`);
        throw new NotFoundException(
          `${ERROR_MESSAGES.APR_NOT_FOUND} com ID ${id}`
        );
      }

      // Realizar soft delete
      await this.db.getPrisma().apr.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userContext.userId,
        },
      });

      this.logger.log(`Modelo APR ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao remover modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao remover modelo APR');
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
      this.logger.error('Erro ao contar modelos APR:', error);
      throw new BadRequestException('Erro ao contar modelos APR');
    }
  }
}
