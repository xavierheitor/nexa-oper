import { ORDER_CONFIG, PAGINATION_CONFIG } from '@common/constants/eletricista';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { handleCrudError } from '@common/utils/error-handler';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import {
  validateId,
  validateOptionalId,
  validateEstadoFormat,
} from '@common/utils/validation';
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
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  EletricistaListResponseDto,
  EletricistaQueryDto,
  EletricistaResponseDto,
} from '../dto';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  contratoId?: number;
}

@Injectable()
export class EletricistaService {
  private readonly logger = new Logger(EletricistaService.name);

  constructor(private readonly db: DatabaseService) {}

  private buildWhereClause(
    search: string | undefined,
    estado: string | undefined,
    contratoId: number | undefined,
    allowedContractIds: number[] | null
  ) {
    const whereClause: any = buildBaseWhereClause();

    // Adicionar busca
    const searchFilter = buildSearchWhereClause(search, {
      nome: true,
      matricula: true,
      telefone: true,
    });
    if (searchFilter) {
      Object.assign(whereClause, searchFilter);
    }

    // Adicionar filtro de estado
    if (estado) {
      whereClause.estado = estado.toUpperCase();
    }

    // Adicionar filtro de contrato
    const contractFilter = buildContractFilter(contratoId, allowedContractIds);
    if (contractFilter) {
      Object.assign(whereClause, contractFilter);
    }

    return whereClause;
  }

  private async fetchEletricistasPage(
    whereClause: Record<string, unknown>,
    page: number,
    limit: number
  ): Promise<{
    data: EletricistaResponseDto[];
    meta: ReturnType<typeof buildPaginationMeta>;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.db.getPrisma().eletricista.findMany({
        where: whereClause,
        orderBy: ORDER_CONFIG.DEFAULT_ORDER,
        skip,
        take: limit,
        select: {
          id: true,
          nome: true,
          matricula: true,
          telefone: true,
          estado: true,
          admissao: true,
          cargoId: true,
          cargo: { select: { id: true, nome: true } },
          contratoId: true,
          contrato: { select: { id: true, nome: true, numero: true } },
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      }),
      this.db.getPrisma().eletricista.count({ where: whereClause }),
    ]);
    const meta = buildPaginationMeta(total, page, limit);
    return { data: data as EletricistaResponseDto[], meta };
  }

  /**
   * Lista eletricistas com paginação e filtros, respeitando permissões
   *
   * @param params - Parâmetros de consulta (página, limite, busca, estado, contrato)
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Lista paginada de eletricistas com metadados
   * @throws BadRequestException - Se parâmetros de paginação forem inválidos
   */
  async findAll(
    params: FindAllParams,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaListResponseDto> {
    const { page, limit, search, estado, contratoId } = params;

    this.logger.log(
      `Listando eletricistas - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, Estado: ${estado ?? 'Todos'}, Contrato: ${contratoId ?? 'Todos'}`
    );

    validatePaginationParams(page, limit);
    if (estado !== undefined) {
      validateEstadoFormat(estado);
    }
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
        estado,
        contratoId,
        allowedContractIds
      );
      const { data, meta } = await this.fetchEletricistasPage(
        whereClause,
        page,
        limit
      );
      return { data, meta, search, timestamp: new Date() };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'eletricistas');
    }
  }

  /**
   * Busca eletricista por ID respeitando permissões
   *
   * @param id - ID do eletricista
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Dados do eletricista encontrado
   * @throws NotFoundException - Se eletricista não for encontrado
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    this.logger.log(`Buscando eletricista ${id}`);
    validateId(id, 'ID do eletricista');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const eletricista = await this.db.getPrisma().eletricista.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          nome: true,
          matricula: true,
          telefone: true,
          estado: true,
          admissao: true,
          cargoId: true,
          cargo: {
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

      if (!eletricista) {
        throw new NotFoundException(ERROR_MESSAGES.ELETRICISTA_NOT_FOUND);
      }

      ensureContractPermission(
        eletricista.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );

      return eletricista as EletricistaResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'eletricista');
    }
  }

  /**
   * Conta total de eletricistas ativos respeitando permissões
   *
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Total de eletricistas ativos
   */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando eletricistas ativos');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      return 0;
    }

    try {
      const count = await this.db.getPrisma().eletricista.count({
        where: {
          deletedAt: null,
          ...(allowedContractIds && {
            contratoId: { in: allowedContractIds },
          }),
        },
      });

      this.logger.log(`Total de eletricistas ativos: ${count}`);
      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'eletricistas');
    }
  }

  /**
   * Converte DTO de query para parâmetros internos com fallback padrão
   */
  mapQueryDtoToParams(query: EletricistaQueryDto): FindAllParams {
    return {
      page: query.page ?? PAGINATION_CONFIG.DEFAULT_PAGE,
      limit: query.limit ?? PAGINATION_CONFIG.DEFAULT_LIMIT,
      search: query.search,
      estado: query.estado,
      contratoId: query.contratoId,
    };
  }
}
