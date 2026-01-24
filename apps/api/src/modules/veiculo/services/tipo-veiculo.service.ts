/**
 * Serviço de Tipos de Veículo
 *
 * CRUD, validações, auditoria e sincronização.
 */

import {
  ORDER_CONFIG,
  ERROR_MESSAGES as MODULE_ERROR_MESSAGES,
} from '@common/constants/tipo-veiculo';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
  UserContext,
} from '@common/utils/audit';
import { handleCrudError } from '@common/utils/error-handler';
import {
  buildPaginationMeta,
  validatePaginationParams,
  normalizePaginationParams,
} from '@common/utils/pagination';
import { validateId } from '@common/utils/validation';
import { DatabaseService } from '@database/database.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateTipoVeiculoDto,
  UpdateTipoVeiculoDto,
  TipoVeiculoListResponseDto,
  TipoVeiculoResponseDto,
  TipoVeiculoSyncDto,
} from '../dto';

interface FindAllParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
}

@Injectable()
export class TipoVeiculoService {
  private readonly logger = new Logger(TipoVeiculoService.name);

  constructor(private readonly db: DatabaseService) {}

  async findAll(
    params: FindAllParams,
    userContext?: UserContext
  ): Promise<TipoVeiculoListResponseDto> {
    this.logger.log('Listando tipos de veículo', { params });
    const { page, limit } = normalizePaginationParams(
      params.page,
      params.limit
    );
    validatePaginationParams(page, limit);
    const where = this.buildWhereClause(params.search);
    const orderBy = this.buildOrderBy(params.orderBy, params.orderDir);

    try {
      const [tipos, total] = await Promise.all([
        this.db.getPrisma().tipoVeiculo.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.getPrisma().tipoVeiculo.count({ where }),
      ]);
      const meta = buildPaginationMeta(total, page, limit);
      return { data: tipos.map(t => this.mapToResponseDto(t)), meta };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'tipos de veículo');
    }
  }

  async findById(
    id: number,
    userContext?: UserContext
  ): Promise<TipoVeiculoResponseDto> {
    validateId(id, 'ID do tipo de veículo');
    try {
      const tipo = await this.db.getPrisma().tipoVeiculo.findFirst({
        where: { id, deletedAt: null },
      });
      if (!tipo)
        throw new NotFoundException(
          MODULE_ERROR_MESSAGES.TIPO_VEICULO_NOT_FOUND
        );
      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'tipo de veículo');
    }
  }

  async create(
    createDto: CreateTipoVeiculoDto,
    userContext?: UserContext
  ): Promise<TipoVeiculoResponseDto> {
    const context = userContext || getDefaultUserContext();
    try {
      await this.checkNomeDuplicado(createDto.nome);
      const tipo = await this.db.getPrisma().tipoVeiculo.create({
        data: { ...createDto, ...createAuditData(context) },
      });
      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'create', 'tipo de veículo');
    }
  }

  async update(
    id: number,
    updateDto: UpdateTipoVeiculoDto,
    userContext?: UserContext
  ): Promise<TipoVeiculoResponseDto> {
    validateId(id, 'ID do tipo de veículo');
    const context = userContext || getDefaultUserContext();
    try {
      await this.findById(id, context);
      if (updateDto.nome) await this.checkNomeDuplicado(updateDto.nome, id);
      const tipo = await this.db.getPrisma().tipoVeiculo.update({
        where: { id },
        data: { ...updateDto, ...updateAuditData(context) },
      });
      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'update', 'tipo de veículo');
    }
  }

  async remove(id: number, userContext?: UserContext): Promise<void> {
    validateId(id, 'ID do tipo de veículo');
    const context = userContext || getDefaultUserContext();
    try {
      await this.findById(id, context);
      await this.checkTipoEmUso(id);
      await this.db.getPrisma().tipoVeiculo.update({
        where: { id },
        data: deleteAuditData(context),
      });
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'tipo de veículo');
    }
  }

  async count(search?: string): Promise<number> {
    try {
      return this.db.getPrisma().tipoVeiculo.count({
        where: this.buildWhereClause(search),
      });
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'tipos de veículo');
    }
  }

  async findAllForSync(): Promise<TipoVeiculoSyncDto[]> {
    try {
      const tipos = await this.db.getPrisma().tipoVeiculo.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });
      return tipos.map(t => this.mapToSyncDto(t));
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'tipos de veículo');
    }
  }

  private buildWhereClause(search?: string): any {
    const where: any = { deletedAt: null };
    if (search) where.nome = { contains: search, mode: 'insensitive' };
    return where;
  }

  private buildOrderBy(orderBy?: string, orderDir?: 'asc' | 'desc'): any {
    return {
      [orderBy || ORDER_CONFIG.DEFAULT_ORDER_BY]:
        orderDir || ORDER_CONFIG.DEFAULT_ORDER_DIR,
    };
  }

  private async checkNomeDuplicado(
    nome: string,
    excludeId?: number
  ): Promise<void> {
    const where: any = {
      nome: { equals: nome, mode: 'insensitive' },
      deletedAt: null,
    };
    if (excludeId) where.id = { not: excludeId };
    const existing = await this.db.getPrisma().tipoVeiculo.findFirst({ where });
    if (existing)
      throw new ConflictException(
        MODULE_ERROR_MESSAGES.TIPO_VEICULO_ALREADY_EXISTS
      );
  }

  private async checkTipoEmUso(id: number): Promise<void> {
    const n = await this.db.getPrisma().veiculo.count({
      where: { tipoVeiculoId: id, deletedAt: null },
    });
    if (n > 0)
      throw new BadRequestException(
        MODULE_ERROR_MESSAGES.CANNOT_DELETE_TIPO_VEICULO_IN_USE
      );
  }

  private mapToResponseDto(t: any): TipoVeiculoResponseDto {
    return {
      id: t.id,
      nome: t.nome,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
      updatedAt: t.updatedAt,
      updatedBy: t.updatedBy,
      deletedAt: t.deletedAt,
      deletedBy: t.deletedBy,
    };
  }

  private mapToSyncDto(t: any): TipoVeiculoSyncDto {
    return {
      id: t.id,
      nome: t.nome,
      createdAt: t.createdAt,
      createdBy: t.createdBy,
      updatedAt: t.updatedAt,
      updatedBy: t.updatedBy,
      deletedAt: t.deletedAt,
      deletedBy: t.deletedBy,
    };
  }
}
