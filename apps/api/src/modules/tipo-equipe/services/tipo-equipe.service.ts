/**
 * Serviço de Tipos de Equipe
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos tipos de equipe, incluindo CRUD completo, validações,
 * auditoria e sincronização.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de tipos de equipe
 * - Validações de regras de negócio
 * - Sincronização para clientes mobile
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * DIFERENCIAIS:
 * - Validação de duplicidade de nome
 * - Verificação de uso antes da exclusão
 * - Auditoria automática em todas as operações
 * - Sincronização otimizada para mobile
 *
 * @example
 * ```typescript
 * // Listar tipos de equipe
 * const result = await tipoEquipeService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'Linha Viva',
 * });
 *
 * // Criar tipo de equipe
 * const tipo = await tipoEquipeService.create(createDto);
 *
 * // Sincronização mobile
 * const tipos = await tipoEquipeService.findAllForSync();
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
  buildPaginationMeta,
  validatePaginationParams,
  normalizePaginationParams,
} from '@common/utils/pagination';
import { validateId } from '@common/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
  UserContext,
} from '@common/utils/audit';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { ORDER_CONFIG, ERROR_MESSAGES as MODULE_ERROR_MESSAGES } from '../constants';
import {
  CreateTipoEquipeDto,
  UpdateTipoEquipeDto,
  TipoEquipeListResponseDto,
  TipoEquipeResponseDto,
  TipoEquipeSyncDto,
  TipoEquipeQueryDto,
} from '../dto';

/**
 * Interface para parâmetros de listagem
 */
interface FindAllParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
}

/**
 * Serviço responsável pelas operações de tipos de equipe
 */
@Injectable()
export class TipoEquipeService {
  private readonly logger = new Logger(TipoEquipeService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Lista tipos de equipe com paginação e filtros
   *
   * @param params - Parâmetros de paginação e filtros
   * @param userContext - Contexto do usuário para auditoria
   * @returns Lista paginada de tipos de equipe
   */
  async findAll(
    params: FindAllParams,
    userContext?: UserContext,
  ): Promise<TipoEquipeListResponseDto> {
    this.logger.log('Listando tipos de equipe', { params });

    // Normaliza parâmetros de paginação
    const { page, limit } = normalizePaginationParams(params.page, params.limit);

    // Valida parâmetros de paginação
    validatePaginationParams(page, limit);

    // Constrói condições de busca
    const where = this.buildWhereClause(params.search);

    // Constrói ordenação
    const orderBy = this.buildOrderBy(params.orderBy, params.orderDir);

    try {
      // Executa consulta com contagem total
      const [tipos, total] = await Promise.all([
        this.db.getPrisma().tipoEquipe.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.getPrisma().tipoEquipe.count({ where }),
      ]);

      // Constrói metadados de paginação
      const meta = buildPaginationMeta(total, page, limit);

      this.logger.log(`Listagem concluída: ${tipos.length} de ${total} tipos`);

      return {
        data: tipos.map((tipo) => this.mapToResponseDto(tipo)),
        meta,
      };
    } catch (error) {
      this.logger.error('Erro ao listar tipos de equipe:', error);
      throw error;
    }
  }

  /**
   * Busca tipo de equipe por ID
   *
   * @param id - ID do tipo de equipe
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de equipe encontrado
   */
  async findById(id: number, userContext?: UserContext): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Buscando tipo de equipe por ID: ${id}`);

    // Valida ID
    validateId(id, 'ID do tipo de equipe');

    try {
      const tipo = await this.db.getPrisma().tipoEquipe.findFirst({
        where: { id, deletedAt: null },
      });

      if (!tipo) {
        throw new NotFoundException(MODULE_ERROR_MESSAGES.TIPO_EQUIPE_NOT_FOUND);
      }

      this.logger.log(`Tipo de equipe encontrado: ${tipo.nome}`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      this.logger.error(`Erro ao buscar tipo de equipe ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cria novo tipo de equipe
   *
   * @param createDto - Dados para criação
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de equipe criado
   */
  async create(
    createDto: CreateTipoEquipeDto,
    userContext?: UserContext,
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log('Criando tipo de equipe', { nome: createDto.nome });

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se já existe tipo com o mesmo nome
      await this.checkNomeDuplicado(createDto.nome);

      // Cria tipo de equipe
      const tipo = await this.db.getPrisma().tipoEquipe.create({
        data: {
          ...createDto,
          ...createAuditData(context),
        },
      });

      this.logger.log(`Tipo de equipe criado com sucesso: ${tipo.nome} (ID: ${tipo.id})`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      this.logger.error('Erro ao criar tipo de equipe:', error);
      throw error;
    }
  }

  /**
   * Atualiza tipo de equipe existente
   *
   * @param id - ID do tipo de equipe
   * @param updateDto - Dados para atualização
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de equipe atualizado
   */
  async update(
    id: number,
    updateDto: UpdateTipoEquipeDto,
    userContext?: UserContext,
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Atualizando tipo de equipe: ${id}`, updateDto);

    // Valida ID
    validateId(id, 'ID do tipo de equipe');

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se tipo existe
      await this.findById(id, context);

      // Verifica duplicidade de nome se estiver sendo atualizado
      if (updateDto.nome) {
        await this.checkNomeDuplicado(updateDto.nome, id);
      }

      // Atualiza tipo de equipe
      const tipo = await this.db.getPrisma().tipoEquipe.update({
        where: { id },
        data: {
          ...updateDto,
          ...updateAuditData(context),
        },
      });

      this.logger.log(`Tipo de equipe atualizado com sucesso: ${tipo.nome} (ID: ${tipo.id})`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      this.logger.error(`Erro ao atualizar tipo de equipe ${id}:`, error);
      throw error;
    }
  }

  /**
   * Remove tipo de equipe (soft delete)
   *
   * @param id - ID do tipo de equipe
   * @param userContext - Contexto do usuário para auditoria
   */
  async remove(id: number, userContext?: UserContext): Promise<void> {
    this.logger.log(`Removendo tipo de equipe: ${id}`);

    // Valida ID
    validateId(id, 'ID do tipo de equipe');

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se tipo existe
      await this.findById(id, context);

      // Verifica se tipo está sendo usado
      await this.checkTipoEmUso(id);

      // Remove tipo de equipe (soft delete)
      await this.db.getPrisma().tipoEquipe.update({
        where: { id },
        data: deleteAuditData(context),
      });

      this.logger.log(`Tipo de equipe removido com sucesso: ${id}`);
    } catch (error) {
      this.logger.error(`Erro ao remover tipo de equipe ${id}:`, error);
      throw error;
    }
  }

  /**
   * Conta tipos de equipe ativos
   *
   * @param search - Termo de busca opcional
   * @returns Número de tipos de equipe ativos
   */
  async count(search?: string): Promise<number> {
    this.logger.log('Contando tipos de equipe', { search });

    try {
      const where = this.buildWhereClause(search);
      const count = await this.db.getPrisma().tipoEquipe.count({ where });

      this.logger.log(`Total de tipos de equipe: ${count}`);

      return count;
    } catch (error) {
      this.logger.error('Erro ao contar tipos de equipe:', error);
      throw error;
    }
  }

  /**
   * Retorna todos os tipos de equipe para sincronização mobile
   *
   * @returns Lista completa de tipos de equipe para sync
   */
  async findAllForSync(): Promise<TipoEquipeSyncDto[]> {
    this.logger.log('Sincronizando tipos de equipe para mobile');

    try {
      const tipos = await this.db.getPrisma().tipoEquipe.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });

      this.logger.log(`Sincronização concluída: ${tipos.length} tipos de equipe`);

      return tipos.map((tipo) => this.mapToSyncDto(tipo));
    } catch (error) {
      this.logger.error('Erro na sincronização de tipos de equipe:', error);
      throw error;
    }
  }

  /**
   * Constrói cláusula WHERE para consultas
   *
   * @param search - Termo de busca opcional
   * @returns Objeto de condições WHERE
   */
  private buildWhereClause(search?: string): any {
    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.nome = {
        contains: search,
        mode: 'insensitive',
      };
    }

    return where;
  }

  /**
   * Constrói ordenação para consultas
   *
   * @param orderBy - Campo de ordenação
   * @param orderDir - Direção da ordenação
   * @returns Objeto de ordenação
   */
  private buildOrderBy(orderBy?: string, orderDir?: 'asc' | 'desc'): any {
    const field = orderBy || ORDER_CONFIG.DEFAULT_ORDER_BY;
    const direction = orderDir || ORDER_CONFIG.DEFAULT_ORDER_DIR;

    return { [field]: direction };
  }

  /**
   * Verifica se nome já existe
   *
   * @param nome - Nome a verificar
   * @param excludeId - ID a excluir da verificação (para atualizações)
   */
  private async checkNomeDuplicado(nome: string, excludeId?: number): Promise<void> {
    const where: any = {
      nome: {
        equals: nome,
        mode: 'insensitive',
      },
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.db.getPrisma().tipoEquipe.findFirst({ where });

    if (existing) {
      throw new ConflictException(MODULE_ERROR_MESSAGES.TIPO_EQUIPE_ALREADY_EXISTS);
    }
  }

  /**
   * Verifica se tipo está sendo usado por equipes
   *
   * @param id - ID do tipo de equipe
   */
  private async checkTipoEmUso(id: number): Promise<void> {
    const equipesCount = await this.db.getPrisma().equipe.count({
      where: {
        tipoEquipeId: id,
        deletedAt: null,
      },
    });

    if (equipesCount > 0) {
      throw new BadRequestException(MODULE_ERROR_MESSAGES.CANNOT_DELETE_TIPO_EQUIPE_IN_USE);
    }
  }

  /**
   * Mapeia entidade para DTO de resposta
   *
   * @param tipo - Entidade do banco de dados
   * @returns DTO de resposta
   */
  private mapToResponseDto(tipo: any): TipoEquipeResponseDto {
    return {
      id: tipo.id,
      nome: tipo.nome,
      createdAt: tipo.createdAt,
      createdBy: tipo.createdBy,
      updatedAt: tipo.updatedAt,
      updatedBy: tipo.updatedBy,
      deletedAt: tipo.deletedAt,
      deletedBy: tipo.deletedBy,
    };
  }

  /**
   * Mapeia entidade para DTO de sincronização
   *
   * @param tipo - Entidade do banco de dados
   * @returns DTO de sincronização
   */
  private mapToSyncDto(tipo: any): TipoEquipeSyncDto {
    return {
      id: tipo.id,
      nome: tipo.nome,
      createdAt: tipo.createdAt,
      createdBy: tipo.createdBy,
      updatedAt: tipo.updatedAt,
      updatedBy: tipo.updatedBy,
      deletedAt: tipo.deletedAt,
      deletedBy: tipo.deletedBy,
    };
  }
}
