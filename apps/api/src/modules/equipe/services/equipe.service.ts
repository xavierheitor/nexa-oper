/**
 * Serviço de Equipes
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * às equipes da operação, incluindo CRUD completo, validações,
 * auditoria e integração com permissões de contrato.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de equipes
 * - Validações de regras de negócio
 * - Integração com permissões de contrato
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * DIFERENCIAIS:
 * - Listagem restrita aos contratos permitidos para o usuário
 * - Validação de duplicidade de nome
 * - Verificação de existência de tipo de equipe e contrato
 * - Auditoria automática em todas as operações
 *
 * @example
 * ```typescript
 * // Listar equipes com restrição por contrato
 * const result = await equipeService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'ABC',
 * }, allowedContracts);
 *
 * // Criar equipe com validação de permissões
 * const equipe = await equipeService.create(createDto, allowedContracts);
 * ```
 */

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import {
  extractAllowedContractIds,
  ensureContractPermission,
} from '@modules/engine/auth/utils/contract-helpers';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import {
  buildSearchWhereClause,
  buildContractFilter,
  buildBaseWhereClause,
} from '@common/utils/where-clause';
import { validateId, validateOptionalId } from '@common/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { ORDER_CONFIG } from '../constants/equipe.constants';
import {
  CreateEquipeDto,
  UpdateEquipeDto,
  EquipeListResponseDto,
  EquipeResponseDto,
  EquipeSyncDto,
} from '../dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

/**
 * Interface de parâmetros para consulta paginada interna
 */
interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  tipoEquipeId?: number;
  contratoId?: number;
}

/**
 * Interface para contexto de usuário (placeholder)
 */
interface UserContext {
  userId: string;
  userName: string;
  roles: string[];
}

/**
 * Serviço responsável pelas operações de equipes
 */
@Injectable()
export class EquipeService {
  private readonly logger = new Logger(EquipeService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Valida ID de equipe
   */
  private validateEquipeId(id: number): void {
    validateId(id, 'ID da equipe');
  }

  /**
   * Valida ID de tipo de equipe
   */
  private validateTipoEquipeId(tipoEquipeId?: number): void {
    validateOptionalId(tipoEquipeId, 'ID do tipo de equipe');
  }

  /**
   * Valida ID de contrato
   */
  private validateContratoId(contratoId?: number): void {
    validateOptionalId(contratoId, 'ID do contrato');
  }

  /**
   * Obtém contexto do usuário
   */
  private getCurrentUserContext(): UserContext {
    return getDefaultUserContext();
  }

  /**
   * Extrai IDs de contratos permitidos a partir da lista de permissões
   */
  private extractAllowedContractIds(
    allowedContracts?: ContractPermission[]
  ): number[] | null {
    return extractAllowedContractIds(allowedContracts);
  }

  /**
   * Garante que o usuário tenha permissão para acessar o contrato informado
   */
  private ensureContractPermission(
    contratoId: number,
    allowedContractIds: number[] | null
  ): void {
    ensureContractPermission(
      contratoId,
      allowedContractIds,
      ERROR_MESSAGES.FORBIDDEN_CONTRACT
    );
  }

  /**
   * Constrói filtros de consulta considerando busca, filtros e permissões
   */
  private buildWhereClause(
    search: string | undefined,
    tipoEquipeId: number | undefined,
    contratoId: number | undefined,
    allowedContractIds: number[] | null
  ) {
    const whereClause: any = buildBaseWhereClause();

    // Adicionar busca
    const searchFilter = buildSearchWhereClause(search, {
      nome: true,
    });
    if (searchFilter) {
      Object.assign(whereClause, searchFilter);
    }

    // Adicionar filtro de tipo de equipe
    if (tipoEquipeId) {
      whereClause.tipoEquipeId = tipoEquipeId;
    }

    // Adicionar filtro de contrato
    const contractFilter = buildContractFilter(contratoId, allowedContractIds);
    if (contractFilter) {
      Object.assign(whereClause, contractFilter);
    }

    return whereClause;
  }

  /**
   * Verifica duplicidade de nome
   */
  private async ensureUniqueNome(
    nome: string,
    ignoreId?: number
  ): Promise<void> {
    const existing = await this.db.getPrisma().equipe.findFirst({
      where: {
        nome,
        deletedAt: null,
        ...(ignoreId && { NOT: { id: ignoreId } }),
      },
    });

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.NOME_DUPLICATE);
    }
  }

  /**
   * Valida existência de tipo de equipe
   */
  private async ensureTipoEquipeExists(tipoEquipeId: number): Promise<void> {
    const tipoEquipe = await this.db.getPrisma().tipoEquipe.findFirst({
      where: {
        id: tipoEquipeId,
        deletedAt: null,
      },
    });

    if (!tipoEquipe) {
      throw new NotFoundException(ERROR_MESSAGES.TIPO_EQUIPE_NOT_FOUND);
    }
  }

  /**
   * Valida existência de contrato
   */
  private async ensureContratoExists(contratoId: number): Promise<void> {
    const contrato = await this.db.getPrisma().contrato.findFirst({
      where: {
        id: contratoId,
        deletedAt: null,
      },
    });

    if (!contrato) {
      throw new NotFoundException(ERROR_MESSAGES.CONTRATO_NOT_FOUND);
    }
  }

  /**
   * Lista equipes com paginação e filtros, respeitando permissões
   */
  async findAll(
    params: FindAllParams,
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeListResponseDto> {
    const { page, limit, search, tipoEquipeId, contratoId } = params;

    this.logger.log(
      `Listando equipes - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, TipoEquipe: ${tipoEquipeId ?? 'Todos'}, Contrato: ${
        contratoId ?? 'Todos'
      }`
    );

    validatePaginationParams(page, limit);
    this.validateTipoEquipeId(tipoEquipeId);
    this.validateContratoId(contratoId);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      const meta = buildPaginationMeta(0, page, limit);
      return {
        data: [],
        meta,
        search,
        timestamp: new Date(),
      };
    }

    if (contratoId) {
      this.ensureContractPermission(contratoId, allowedContractIds);
    }

    try {
      const whereClause = this.buildWhereClause(
        search,
        tipoEquipeId,
        contratoId,
        allowedContractIds
      );

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.db.getPrisma().equipe.findMany({
          where: whereClause,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip,
          take: limit,
          select: {
            id: true,
            nome: true,
            tipoEquipeId: true,
            tipoEquipe: {
              select: {
                id: true,
                nome: true,
              },
            },
            contratoId: true,
            contrato: {
              select: {
                id: true,
                nome: true,
                numero: true,
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
        this.db.getPrisma().equipe.count({ where: whereClause }),
      ]);

      const meta = buildPaginationMeta(total, page, limit);

      return {
        data: data as EquipeResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao listar equipes:', error);
      throw new BadRequestException('Erro ao listar equipes');
    }
  }

  /**
   * Lista equipes para sincronização mobile (sem paginação)
   */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeSyncDto[]> {
    this.logger.log('Sincronizando equipes para cliente mobile');
    this.logger.debug(
      `Contratos recebidos no service: ${JSON.stringify(allowedContracts)}`
    );
    this.logger.debug(
      `Tipo dos contratos no service: ${typeof allowedContracts}`
    );
    this.logger.debug(`É array no service: ${Array.isArray(allowedContracts)}`);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.logger.debug(
      `IDs de contratos extraídos: ${JSON.stringify(allowedContractIds)}`
    );

    if (allowedContractIds && allowedContractIds.length === 0) {
      this.logger.warn(
        'Nenhum contrato permitido encontrado, retornando array vazio'
      );
      return [];
    }

    try {
      const whereClause = {
        deletedAt: null,
        ...(allowedContractIds && {
          contratoId: { in: allowedContractIds },
        }),
      };

      this.logger.debug(
        `Where clause para busca: ${JSON.stringify(whereClause)}`
      );

      const data = await this.db.getPrisma().equipe.findMany({
        where: whereClause,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          tipoEquipeId: true,
          contratoId: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de equipes retornou ${data.length} registros`
      );
      this.logger.debug(
        `Dados retornados: ${JSON.stringify(data.slice(0, 2))}...`
      );
      return data as EquipeSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar equipes:', error);
      this.logger.error(`Stack trace:`, error.stack);
      throw new BadRequestException('Erro ao sincronizar equipes');
    }
  }

  /**
   * Busca equipe por ID respeitando permissões
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    this.logger.log(`Buscando equipe por ID: ${id}`);
    this.validateEquipeId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const equipe = await this.db.getPrisma().equipe.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          nome: true,
          tipoEquipeId: true,
          tipoEquipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          contratoId: true,
          contrato: {
            select: {
              id: true,
              nome: true,
              numero: true,
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

      if (!equipe) {
        this.logger.warn(`Equipe não encontrada: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.EQUIPE_NOT_FOUND);
      }

      this.ensureContractPermission(equipe.contratoId, allowedContractIds);

      return equipe as EquipeResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao buscar equipe ${id}:`, error);
      throw new BadRequestException('Erro ao buscar equipe');
    }
  }

  /**
   * Cria nova equipe com validações e auditoria
   */
  async create(
    createEquipeDto: CreateEquipeDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    const { nome, tipoEquipeId, contratoId } = createEquipeDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(
      `Criando equipe ${nome} - Contrato: ${contratoId}, Tipo: ${tipoEquipeId}`
    );

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.ensureContractPermission(contratoId, allowedContractIds);

    try {
      await this.ensureUniqueNome(nome.trim());
      await this.ensureTipoEquipeExists(tipoEquipeId);
      await this.ensureContratoExists(contratoId);

      const equipe = await this.db.getPrisma().equipe.create({
        data: {
          nome: nome.trim(),
          tipoEquipe: { connect: { id: tipoEquipeId } },
          contrato: { connect: { id: contratoId } },
          ...createAuditData(userContext),
        },
        select: {
          id: true,
          nome: true,
          tipoEquipeId: true,
          tipoEquipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          contratoId: true,
          contrato: {
            select: {
              id: true,
              nome: true,
              numero: true,
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

      this.logger.log(`Equipe criada com sucesso - ID: ${equipe.id}`);
      return equipe as EquipeResponseDto;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error('Erro ao criar equipe:', error);
      throw new BadRequestException('Erro ao criar equipe');
    }
  }

  /**
   * Atualiza equipe existente com validações
   */
  async update(
    id: number,
    updateEquipeDto: UpdateEquipeDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    const { nome, tipoEquipeId, contratoId } = updateEquipeDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(`Atualizando equipe ${id}`);
    this.validateEquipeId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const existingEquipe = await this.db.getPrisma().equipe.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingEquipe) {
        this.logger.warn(`Tentativa de atualizar equipe inexistente: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.EQUIPE_NOT_FOUND);
      }

      this.ensureContractPermission(
        existingEquipe.contratoId,
        allowedContractIds
      );

      if (contratoId && contratoId !== existingEquipe.contratoId) {
        this.ensureContractPermission(contratoId, allowedContractIds);
        await this.ensureContratoExists(contratoId);
      }

      if (tipoEquipeId) {
        await this.ensureTipoEquipeExists(tipoEquipeId);
      }

      if (nome && nome.trim() !== existingEquipe.nome) {
        await this.ensureUniqueNome(nome.trim(), id);
      }

      const equipe = await this.db.getPrisma().equipe.update({
        where: { id },
        data: {
          ...(nome && { nome: nome.trim() }),
          ...(tipoEquipeId && {
            tipoEquipe: { connect: { id: tipoEquipeId } },
          }),
          ...(contratoId && {
            contrato: { connect: { id: contratoId } },
          }),
          ...updateAuditData(userContext),
        },
        select: {
          id: true,
          nome: true,
          tipoEquipeId: true,
          tipoEquipe: {
            select: {
              id: true,
              nome: true,
            },
          },
          contratoId: true,
          contrato: {
            select: {
              id: true,
              nome: true,
              numero: true,
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

      this.logger.log(`Equipe ${id} atualizada com sucesso`);
      return equipe as EquipeResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao atualizar equipe ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar equipe');
    }
  }

  /**
   * Remove equipe (soft delete)
   */
  async remove(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo equipe ${id}`);
    this.validateEquipeId(id);

    const userContext = this.getCurrentUserContext();
    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const equipe = await this.db.getPrisma().equipe.findFirst({
        where: { id, deletedAt: null },
      });

      if (!equipe) {
        this.logger.warn(`Tentativa de remover equipe inexistente: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.EQUIPE_NOT_FOUND);
      }

      this.ensureContractPermission(equipe.contratoId, allowedContractIds);

      await this.db.getPrisma().equipe.update({
        where: { id },
        data: deleteAuditData(userContext),
      });

      this.logger.log(`Equipe ${id} removida com sucesso (soft delete)`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao remover equipe ${id}:`, error);
      throw new BadRequestException('Erro ao remover equipe');
    }
  }

  /**
   * Conta total de equipes ativas respeitando permissões
   */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando equipes ativas');

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      return 0;
    }

    try {
      const count = await this.db.getPrisma().equipe.count({
        where: {
          deletedAt: null,
          ...(allowedContractIds && {
            contratoId: { in: allowedContractIds },
          }),
        },
      });

      this.logger.log(`Total de equipes ativas: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Erro ao contar equipes:', error);
      throw new BadRequestException('Erro ao contar equipes');
    }
  }
}
