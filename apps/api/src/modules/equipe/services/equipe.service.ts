/**
 * Serviço de Equipes
 *
 * Listagem e contagem. Criação, atualização e exclusão são feitas no web.
 * Sincronização para mobile em EquipeSyncService.
 */

import { ORDER_CONFIG } from '@common/constants/equipe';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { handleCrudError } from '@common/utils/error-handler';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import { validateId, validateOptionalId } from '@common/utils/validation';
import {
  buildSearchWhereClause,
  buildContractFilter,
  buildBaseWhereClause,
} from '@common/utils/where-clause';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@modules/engine/auth/services/contract-permissions.service';
import {
  extractAllowedContractIds,
  ensureContractPermission,
} from '@modules/engine/auth/utils/contract-helpers';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { EquipeListResponseDto, EquipeResponseDto } from '../dto';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  tipoEquipeId?: number;
  contratoId?: number;
}

/**
 * Serviço responsável pelas operações de equipes
 */
@Injectable()
export class EquipeService {
  private readonly logger = new Logger(EquipeService.name);

  constructor(private readonly db: DatabaseService) {}

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
    validateOptionalId(tipoEquipeId, 'ID do tipo de equipe');
    validateOptionalId(contratoId, 'ID do contrato');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

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
      ensureContractPermission(
        contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );
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
      handleCrudError(error, this.logger, 'list', 'equipes');
    }
  }

  /**
   * Busca equipe por ID respeitando permissões
   *
   * @param id - ID da equipe
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Dados da equipe encontrada
   * @throws NotFoundException - Se equipe não for encontrada
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<EquipeResponseDto> {
    this.logger.log(`Buscando equipe por ID: ${id}`);
    validateId(id, 'ID da equipe');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

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

      ensureContractPermission(
        equipe.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );

      return equipe as EquipeResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'equipe');
    }
  }

  /**
   * Conta total de equipes ativas respeitando permissões
   *
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Total de equipes ativas
   */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando equipes ativas');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

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
      handleCrudError(error, this.logger, 'count', 'equipes');
    }
  }
}
