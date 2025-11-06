/**
 * Serviço de Tipos de Veículo
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos tipos de veículo, incluindo CRUD completo, validações,
 * auditoria e sincronização.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de tipos de veículo
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
 * // Listar tipos de veículo
 * const result = await tipoVeiculoService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'Caminhão',
 * });
 *
 * // Criar tipo de veículo
 * const tipo = await tipoVeiculoService.create(createDto);
 *
 * // Sincronização mobile
 * const tipos = await tipoVeiculoService.findAllForSync();
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
import { handleCrudError } from '@common/utils/error-handler';
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
  CreateTipoVeiculoDto,
  UpdateTipoVeiculoDto,
  TipoVeiculoListResponseDto,
  TipoVeiculoResponseDto,
  TipoVeiculoSyncDto,
  TipoVeiculoQueryDto,
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
 * Serviço responsável pelas operações de tipos de veículo
 */
@Injectable()
export class TipoVeiculoService {
  private readonly logger = new Logger(TipoVeiculoService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Lista tipos de veículo com paginação e filtros
   *
   * @param params - Parâmetros de paginação e filtros
   * @param userContext - Contexto do usuário para auditoria
   * @returns Lista paginada de tipos de veículo
   */
  async findAll(
    params: FindAllParams,
    userContext?: UserContext,
  ): Promise<TipoVeiculoListResponseDto> {
    this.logger.log('Listando tipos de veículo', { params });

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
        this.db.getPrisma().tipoVeiculo.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.getPrisma().tipoVeiculo.count({ where }),
      ]);

      // Constrói metadados de paginação
      const meta = buildPaginationMeta(total, page, limit);

      this.logger.log(`Listagem concluída: ${tipos.length} de ${total} tipos`);

      return {
        data: tipos.map((tipo) => this.mapToResponseDto(tipo)),
        meta,
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'tipos de veículo');
    }
  }

  /**
   * Busca tipo de veículo por ID
   *
   * @param id - ID do tipo de veículo
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de veículo encontrado
   */
  async findById(id: number, userContext?: UserContext): Promise<TipoVeiculoResponseDto> {
    this.logger.log(`Buscando tipo de veículo por ID: ${id}`);

    // Valida ID
    validateId(id, 'ID do tipo de veículo');

    try {
      const tipo = await this.db.getPrisma().tipoVeiculo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!tipo) {
        throw new NotFoundException(MODULE_ERROR_MESSAGES.TIPO_VEICULO_NOT_FOUND);
      }

      this.logger.log(`Tipo de veículo encontrado: ${tipo.nome}`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'tipo de veículo');
    }
  }

  /**
   * Cria novo tipo de veículo
   *
   * @param createDto - Dados para criação
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de veículo criado
   */
  async create(
    createDto: CreateTipoVeiculoDto,
    userContext?: UserContext,
  ): Promise<TipoVeiculoResponseDto> {
    this.logger.log('Criando tipo de veículo', { nome: createDto.nome });

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se já existe tipo com o mesmo nome
      await this.checkNomeDuplicado(createDto.nome);

      // Cria tipo de veículo
      const tipo = await this.db.getPrisma().tipoVeiculo.create({
        data: {
          ...createDto,
          ...createAuditData(context),
        },
      });

      this.logger.log(`Tipo de veículo criado com sucesso: ${tipo.nome} (ID: ${tipo.id})`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'create', 'tipo de veículo');
    }
  }

  /**
   * Atualiza tipo de veículo existente
   *
   * @param id - ID do tipo de veículo
   * @param updateDto - Dados para atualização
   * @param userContext - Contexto do usuário para auditoria
   * @returns Tipo de veículo atualizado
   */
  async update(
    id: number,
    updateDto: UpdateTipoVeiculoDto,
    userContext?: UserContext,
  ): Promise<TipoVeiculoResponseDto> {
    this.logger.log(`Atualizando tipo de veículo: ${id}`, updateDto);

    // Valida ID
    validateId(id, 'ID do tipo de veículo');

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se tipo existe
      await this.findById(id, context);

      // Verifica duplicidade de nome se estiver sendo atualizado
      if (updateDto.nome) {
        await this.checkNomeDuplicado(updateDto.nome, id);
      }

      // Atualiza tipo de veículo
      const tipo = await this.db.getPrisma().tipoVeiculo.update({
        where: { id },
        data: {
          ...updateDto,
          ...updateAuditData(context),
        },
      });

      this.logger.log(`Tipo de veículo atualizado com sucesso: ${tipo.nome} (ID: ${tipo.id})`);

      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'update', 'tipo de veículo');
    }
  }

  /**
   * Remove tipo de veículo (soft delete)
   *
   * @param id - ID do tipo de veículo
   * @param userContext - Contexto do usuário para auditoria
   */
  async remove(id: number, userContext?: UserContext): Promise<void> {
    this.logger.log(`Removendo tipo de veículo: ${id}`);

    // Valida ID
    validateId(id, 'ID do tipo de veículo');

    const context = userContext || getDefaultUserContext();

    try {
      // Verifica se tipo existe
      await this.findById(id, context);

      // Verifica se tipo está sendo usado
      await this.checkTipoEmUso(id);

      // Remove tipo de veículo (soft delete)
      await this.db.getPrisma().tipoVeiculo.update({
        where: { id },
        data: deleteAuditData(context),
      });

      this.logger.log(`Tipo de veículo removido com sucesso: ${id}`);
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'tipo de veículo');
    }
  }

  /**
   * Conta tipos de veículo ativos
   *
   * @param search - Termo de busca opcional
   * @returns Número de tipos de veículo ativos
   */
  async count(search?: string): Promise<number> {
    this.logger.log('Contando tipos de veículo', { search });

    try {
      const where = this.buildWhereClause(search);
      const count = await this.db.getPrisma().tipoVeiculo.count({ where });

      this.logger.log(`Total de tipos de veículo: ${count}`);

      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'tipos de veículo');
    }
  }

  /**
   * Retorna todos os tipos de veículo para sincronização mobile
   *
   * @returns Lista completa de tipos de veículo para sync
   */
  async findAllForSync(): Promise<TipoVeiculoSyncDto[]> {
    this.logger.log('Sincronizando tipos de veículo para mobile');

    try {
      const tipos = await this.db.getPrisma().tipoVeiculo.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });

      this.logger.log(`Sincronização concluída: ${tipos.length} tipos de veículo`);

      return tipos.map((tipo) => this.mapToSyncDto(tipo));
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'tipos de veículo');
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

    const existing = await this.db.getPrisma().tipoVeiculo.findFirst({ where });

    if (existing) {
      throw new ConflictException(MODULE_ERROR_MESSAGES.TIPO_VEICULO_ALREADY_EXISTS);
    }
  }

  /**
   * Verifica se tipo está sendo usado por veículos
   *
   * @param id - ID do tipo de veículo
   */
  private async checkTipoEmUso(id: number): Promise<void> {
    const veiculosCount = await this.db.getPrisma().veiculo.count({
      where: {
        tipoVeiculoId: id,
        deletedAt: null,
      },
    });

    if (veiculosCount > 0) {
      throw new BadRequestException(MODULE_ERROR_MESSAGES.CANNOT_DELETE_TIPO_VEICULO_IN_USE);
    }
  }

  /**
   * Mapeia entidade para DTO de resposta
   *
   * @param tipo - Entidade do banco de dados
   * @returns DTO de resposta
   */
  private mapToResponseDto(tipo: any): TipoVeiculoResponseDto {
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
  private mapToSyncDto(tipo: any): TipoVeiculoSyncDto {
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
