/**
 * Serviço de Tipos de Equipe
 *
 * Lógica de negócio de tipos de equipe: CRUD, validações,
 * auditoria e sincronização.
 */

import {
  ORDER_CONFIG,
  ERROR_MESSAGES as MODULE_ERROR_MESSAGES,
} from '@common/constants/tipo-equipe';
import { handleCrudError } from '@common/utils/error-handler';
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
import { DatabaseService } from '@database/database.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateTipoEquipeDto,
  UpdateTipoEquipeDto,
  TipoEquipeListResponseDto,
  TipoEquipeResponseDto,
  TipoEquipeSyncDto,
  TipoEquipeQueryDto,
} from '../dto';

interface FindAllParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  search?: string;
}

@Injectable()
export class TipoEquipeService {
  private readonly logger = new Logger(TipoEquipeService.name);

  constructor(private readonly db: DatabaseService) {}

  async findAll(
    params: FindAllParams,
    userContext?: UserContext
  ): Promise<TipoEquipeListResponseDto> {
    this.logger.log('Listando tipos de equipe', { params });

    const { page, limit } = normalizePaginationParams(params.page, params.limit);
    validatePaginationParams(page, limit);
    const where = this.buildWhereClause(params.search);
    const orderBy = this.buildOrderBy(params.orderBy, params.orderDir);

    try {
      const [tipos, total] = await Promise.all([
        this.db.getPrisma().tipoEquipe.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.db.getPrisma().tipoEquipe.count({ where }),
      ]);

      const meta = buildPaginationMeta(total, page, limit);
      this.logger.log(`Listagem concluída: ${tipos.length} de ${total} tipos`);

      return {
        data: tipos.map(tipo => this.mapToResponseDto(tipo)),
        meta,
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'tipos de equipe');
    }
  }

  async findById(
    id: number,
    userContext?: UserContext
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Buscando tipo de equipe por ID: ${id}`);
    validateId(id, 'ID do tipo de equipe');

    try {
      const tipo = await this.db.getPrisma().tipoEquipe.findFirst({
        where: { id, deletedAt: null },
      });

      if (!tipo) {
        throw new NotFoundException(
          MODULE_ERROR_MESSAGES.TIPO_EQUIPE_NOT_FOUND
        );
      }

      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'tipo de equipe');
    }
  }

  async create(
    createDto: CreateTipoEquipeDto,
    userContext?: UserContext
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log('Criando tipo de equipe', { nome: createDto.nome });
    const context = userContext || getDefaultUserContext();

    try {
      await this.checkNomeDuplicado(createDto.nome);

      const tipo = await this.db.getPrisma().tipoEquipe.create({
        data: {
          ...createDto,
          ...createAuditData(context),
        },
      });

      this.logger.log(
        `Tipo de equipe criado com sucesso: ${tipo.nome} (ID: ${tipo.id})`
      );
      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'create', 'tipo de equipe');
    }
  }

  async update(
    id: number,
    updateDto: UpdateTipoEquipeDto,
    userContext?: UserContext
  ): Promise<TipoEquipeResponseDto> {
    this.logger.log(`Atualizando tipo de equipe: ${id}`, updateDto);
    validateId(id, 'ID do tipo de equipe');
    const context = userContext || getDefaultUserContext();

    try {
      await this.findById(id, context);
      if (updateDto.nome) {
        await this.checkNomeDuplicado(updateDto.nome, id);
      }

      const tipo = await this.db.getPrisma().tipoEquipe.update({
        where: { id },
        data: {
          ...updateDto,
          ...updateAuditData(context),
        },
      });

      return this.mapToResponseDto(tipo);
    } catch (error) {
      handleCrudError(error, this.logger, 'update', 'tipo de equipe');
    }
  }

  async remove(id: number, userContext?: UserContext): Promise<void> {
    this.logger.log(`Removendo tipo de equipe: ${id}`);
    validateId(id, 'ID do tipo de equipe');
    const context = userContext || getDefaultUserContext();

    try {
      await this.findById(id, context);
      await this.checkTipoEmUso(id);

      await this.db.getPrisma().tipoEquipe.update({
        where: { id },
        data: deleteAuditData(context),
      });

      this.logger.log(`Tipo de equipe removido com sucesso: ${id}`);
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'tipo de equipe');
    }
  }

  async count(search?: string): Promise<number> {
    this.logger.log('Contando tipos de equipe', { search });
    try {
      const where = this.buildWhereClause(search);
      return this.db.getPrisma().tipoEquipe.count({ where });
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'tipos de equipe');
    }
  }

  async findAllForSync(): Promise<TipoEquipeSyncDto[]> {
    this.logger.log('Sincronizando tipos de equipe para mobile');
    try {
      const tipos = await this.db.getPrisma().tipoEquipe.findMany({
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });
      return tipos.map(tipo => this.mapToSyncDto(tipo));
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'tipos de equipe');
    }
  }

  private buildWhereClause(search?: string): any {
    const where: any = { deletedAt: null };
    if (search) {
      where.nome = { contains: search, mode: 'insensitive' };
    }
    return where;
  }

  private buildOrderBy(orderBy?: string, orderDir?: 'asc' | 'desc'): any {
    const field = orderBy || ORDER_CONFIG.DEFAULT_ORDER_BY;
    const direction = orderDir || ORDER_CONFIG.DEFAULT_ORDER_DIR;
    return { [field]: direction };
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

    const existing = await this.db.getPrisma().tipoEquipe.findFirst({ where });
    if (existing) {
      throw new ConflictException(
        MODULE_ERROR_MESSAGES.TIPO_EQUIPE_ALREADY_EXISTS
      );
    }
  }

  private async checkTipoEmUso(id: number): Promise<void> {
    const equipesCount = await this.db.getPrisma().equipe.count({
      where: { tipoEquipeId: id, deletedAt: null },
    });
    if (equipesCount > 0) {
      throw new BadRequestException(
        MODULE_ERROR_MESSAGES.CANNOT_DELETE_TIPO_EQUIPE_IN_USE
      );
    }
  }

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
