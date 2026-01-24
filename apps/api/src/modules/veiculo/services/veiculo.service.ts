/**
 * Serviço de Veículos: CRUD, validações, auditoria e permissões de contrato.
 */

import { ERROR_MESSAGES } from '@common/constants/errors';
import { ORDER_CONFIG } from '@common/constants/veiculo';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import { getDefaultUserContext, deleteAuditData } from '@common/utils/audit';
import { handleCrudError, handlePrismaUniqueError } from '@common/utils/error-handler';
import { validatePaginationParams, buildPaginationMeta } from '@common/utils/pagination';
import {
  validateId,
  validateOptionalId,
  ensureContratoExists,
  ensureTipoVeiculoExists,
} from '@common/utils/validation';
import { DatabaseService } from '@database/database.service';
import { ContractPermission } from '@core/auth/services/contract-permissions.service';
import {
  extractAllowedContractIds,
  ensureContractPermission,
} from '@core/auth/utils/contract-helpers';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import {
  CreateVeiculoDto,
  UpdateVeiculoDto,
  VeiculoListResponseDto,
  VeiculoResponseDto,
  VeiculoSyncDto,
} from '../dto';
import {
  buildCreateVeiculoData,
  buildUpdateVeiculoData,
  runFindAllQuery,
} from './veiculo-queries';
import { VEICULO_LIST_SELECT, VEICULO_SYNC_SELECT } from './veiculo-selects';
import { buildVeiculoWhereClause } from './veiculo-where';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  tipoVeiculoId?: number;
  contratoId?: number;
}

@Injectable()
export class VeiculoService {
  private readonly logger = new Logger(VeiculoService.name);

  constructor(private readonly db: DatabaseService) {}

  /** Lista veículos com paginação e filtros, respeitando permissões. */
  async findAll(
    params: FindAllParams,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoListResponseDto> {
    const { page, limit, search, tipoVeiculoId, contratoId } = params;
    this.logger.log(
      `Listando veículos - Página: ${page}, Limite: ${limit}, Busca: ${search || 'N/A'}, TipoVeiculo: ${tipoVeiculoId ?? 'Todos'}, Contrato: ${contratoId ?? 'Todos'}`
    );

    validatePaginationParams(page, limit);
    validateOptionalId(tipoVeiculoId, 'ID do tipo de veículo');
    validateOptionalId(contratoId, 'ID do contrato');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length === 0) {
      return {
        data: [],
        meta: buildPaginationMeta(0, page, limit),
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
      const whereClause = buildVeiculoWhereClause(
        search,
        tipoVeiculoId,
        contratoId,
        allowedContractIds
      );
      const { data, total, currPage, pageSize } = await runFindAllQuery(
        this.db.getPrisma(),
        whereClause,
        page,
        limit
      );
      return {
        data: data as VeiculoResponseDto[],
        meta: buildPaginationMeta(total, currPage, pageSize) as PaginationMetaDto,
        search,
        timestamp: new Date(),
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'veículos');
    }
  }

  /** Lista veículos para sincronização mobile (sem paginação). */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoSyncDto[]> {
    this.logger.log('Sincronizando veículos para cliente mobile');
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length === 0) return [];

    try {
      const where = {
        deletedAt: null,
        ...(allowedContractIds && { contratoId: { in: allowedContractIds } }),
      };
      const data = await this.db.getPrisma().veiculo.findMany({
        where,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: VEICULO_SYNC_SELECT,
      });
      this.logger.log(`Sincronização de veículos retornou ${data.length} registros`);
      return data as VeiculoSyncDto[];
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'veículos');
    }
  }

  /** Busca veículo por ID respeitando permissões. */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Buscando veículo por ID: ${id}`);
    validateId(id, 'ID do veículo');
    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const veiculo = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
        select: VEICULO_LIST_SELECT,
      });
      if (!veiculo) {
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }
      ensureContractPermission(
        veiculo.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );
      return veiculo as VeiculoResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'veículo');
    }
  }

  /** Cria novo veículo com validações e auditoria. */
  async create(
    createVeiculoDto: CreateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { placa, modelo, ano, tipoVeiculoId, contratoId } = createVeiculoDto;
    const userContext = getDefaultUserContext();
    this.logger.log(`Criando veículo ${placa} - Contrato: ${contratoId}, Tipo: ${tipoVeiculoId}`);

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    ensureContractPermission(
      contratoId,
      allowedContractIds,
      ERROR_MESSAGES.FORBIDDEN_CONTRACT
    );

    try {
      await ensureTipoVeiculoExists(this.db.getPrisma(), tipoVeiculoId);
      await ensureContratoExists(this.db.getPrisma(), contratoId);

      const veiculo = await this.db.getPrisma().veiculo.create({
        data: buildCreateVeiculoData(createVeiculoDto, userContext),
        select: VEICULO_LIST_SELECT,
      });
      this.logger.log(`Veículo criado com sucesso - ID: ${veiculo.id}`);
      return veiculo as VeiculoResponseDto;
    } catch (error) {
      handlePrismaUniqueError(error, this.logger, 'veículo');
      handleCrudError(error, this.logger, 'create', 'veículo');
    }
  }

  /** Atualiza veículo existente com validações. */
  async update(
    id: number,
    updateVeiculoDto: UpdateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { contratoId, tipoVeiculoId } = updateVeiculoDto;
    const userContext = getDefaultUserContext();
    this.logger.log(`Atualizando veículo ${id}`);
    validateId(id, 'ID do veículo');
    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const existing = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) {
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }
      ensureContractPermission(
        existing.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );
      if (contratoId && contratoId !== existing.contratoId) {
        ensureContractPermission(
          contratoId,
          allowedContractIds,
          ERROR_MESSAGES.FORBIDDEN_CONTRACT
        );
        await ensureContratoExists(this.db.getPrisma(), contratoId);
      }
      if (tipoVeiculoId) {
        await ensureTipoVeiculoExists(this.db.getPrisma(), tipoVeiculoId);
      }

      const veiculo = await this.db.getPrisma().veiculo.update({
        where: { id },
        data: buildUpdateVeiculoData(updateVeiculoDto, userContext),
        select: VEICULO_LIST_SELECT,
      });
      this.logger.log(`Veículo ${id} atualizado com sucesso`);
      return veiculo as VeiculoResponseDto;
    } catch (error) {
      handlePrismaUniqueError(error, this.logger, 'veículo');
      handleCrudError(error, this.logger, 'update', 'veículo');
    }
  }

  /** Remove veículo (soft delete). */
  async remove(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo veículo ${id}`);
    validateId(id, 'ID do veículo');
    const userContext = getDefaultUserContext();
    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const veiculo = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
      });
      if (!veiculo) {
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }
      ensureContractPermission(
        veiculo.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );
      await this.db.getPrisma().veiculo.update({
        where: { id },
        data: deleteAuditData(userContext),
      });
      this.logger.log(`Veículo ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'veículo');
    }
  }

  /** Conta total de veículos ativos respeitando permissões. */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando veículos ativos');
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length === 0) return 0;

    try {
      const count = await this.db.getPrisma().veiculo.count({
        where: {
          deletedAt: null,
          ...(allowedContractIds && { contratoId: { in: allowedContractIds } }),
        },
      });
      this.logger.log(`Total de veículos ativos: ${count}`);
      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'veículos');
    }
  }
}
