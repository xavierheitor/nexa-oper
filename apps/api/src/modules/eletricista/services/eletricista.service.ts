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
  validateId,
  validateOptionalId,
  validateEstadoFormat,
} from '@common/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { ERROR_MESSAGES } from '@common/constants/errors';
import {
  ORDER_CONFIG,
  PAGINATION_CONFIG,
} from '../constants/eletricista.constants';
import {
  CreateEletricistaDto,
  EletricistaListResponseDto,
  EletricistaQueryDto,
  EletricistaResponseDto,
  EletricistaSyncDto,
  UpdateEletricistaDto,
} from '../dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  estado?: string;
  contratoId?: number;
}

interface UserContext {
  userId: string;
  userName: string;
  roles: string[];
}

@Injectable()
export class EletricistaService {
  private readonly logger = new Logger(EletricistaService.name);

  constructor(private readonly db: DatabaseService) {}

  private validatePaginationParams(page: number, limit: number): void {
    validatePaginationParams(page, limit);
  }

  private validateEletricistaId(id: number): void {
    validateId(id, 'ID do eletricista');
  }

  private validateEstado(estado?: string): void {
    if (estado !== undefined) {
      validateEstadoFormat(estado);
    }
  }

  private validateContratoId(contratoId?: number): void {
    validateOptionalId(contratoId, 'ID do contrato');
  }

  private getCurrentUserContext(): UserContext {
    return getDefaultUserContext();
  }

  private extractAllowedContractIds(
    allowedContracts?: ContractPermission[]
  ): number[] | null {
    return extractAllowedContractIds(allowedContracts);
  }

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

  private buildWhereClause(
    search: string | undefined,
    estado: string | undefined,
    contratoId: number | undefined,
    allowedContractIds: number[] | null
  ) {
    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      const term = search.trim();
      whereClause.OR = [
        {
          nome: {
            contains: term,
            mode: 'insensitive' as const,
          },
        },
        {
          matricula: {
            contains: term,
            mode: 'insensitive' as const,
          },
        },
        {
          telefone: {
            contains: term,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    if (estado) {
      whereClause.estado = estado.toUpperCase();
    }

    if (contratoId) {
      whereClause.contratoId = contratoId;
    } else if (allowedContractIds) {
      whereClause.contratoId = {
        in: allowedContractIds,
      };
    }

    return whereClause;
  }

  private buildPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMetaDto {
    return buildPaginationMeta(total, page, limit);
  }

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

  private async ensureUniqueMatricula(
    matricula: string,
    ignoreId?: number
  ): Promise<void> {
    const existing = await this.db.getPrisma().eletricista.findFirst({
      where: {
        deletedAt: null,
        matricula: {
          equals: matricula,
        },
        ...(ignoreId && {
          id: {
            not: ignoreId,
          },
        }),
      },
    });

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.MATRICULA_DUPLICATE);
    }
  }

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

    this.validatePaginationParams(page, limit);
    this.validateEstado(estado);
    this.validateContratoId(contratoId);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      const meta = this.buildPaginationMeta(0, page, limit);
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
        estado,
        contratoId,
        allowedContractIds
      );

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
        }),
        this.db.getPrisma().eletricista.count({ where: whereClause }),
      ]);

      const meta = this.buildPaginationMeta(total, page, limit);

      return {
        data: data as EletricistaResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao listar eletricistas:', error);
      throw new BadRequestException('Erro ao listar eletricistas');
    }
  }

  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    this.logger.log(`Buscando eletricista ${id}`);
    this.validateEletricistaId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

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

      this.ensureContractPermission(eletricista.contratoId, allowedContractIds);

      return eletricista as EletricistaResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao buscar eletricista ${id}:`, error);
      throw new BadRequestException('Erro ao buscar eletricista');
    }
  }

  async create(
    createEletricistaDto: CreateEletricistaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    const { nome, matricula, telefone, estado, contratoId } =
      createEletricistaDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(
      `Criando eletricista ${matricula} - Contrato: ${contratoId}`
    );

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.ensureContractPermission(contratoId, allowedContractIds);

    try {
      await this.ensureContratoExists(contratoId);
      await this.ensureUniqueMatricula(matricula.trim());

      const eletricista = await this.db.getPrisma().eletricista.create({
        data: {
          nome: nome.trim(),
          matricula: matricula.trim(),
          telefone: telefone.trim(),
          estado: estado.toUpperCase(),
          admissao: createEletricistaDto.admissao || new Date(),
          cargo: { connect: { id: createEletricistaDto.cargoId } },
          contrato: { connect: { id: contratoId } },
          ...createAuditData(userContext),
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

      this.logger.log(`Eletricista criado com sucesso - ID: ${eletricista.id}`);
      return eletricista as EletricistaResponseDto;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error('Erro ao criar eletricista:', error);
      throw new BadRequestException('Erro ao criar eletricista');
    }
  }

  async update(
    id: number,
    updateEletricistaDto: UpdateEletricistaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    const { nome, matricula, telefone, estado, admissao, cargoId, contratoId } =
      updateEletricistaDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(`Atualizando eletricista ${id}`);
    this.validateEletricistaId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const existingEletricista = await this.db
        .getPrisma()
        .eletricista.findFirst({
          where: { id, deletedAt: null },
        });

      if (!existingEletricista) {
        throw new NotFoundException(ERROR_MESSAGES.ELETRICISTA_NOT_FOUND);
      }

      this.ensureContractPermission(
        existingEletricista.contratoId,
        allowedContractIds
      );

      if (contratoId && contratoId !== existingEletricista.contratoId) {
        this.ensureContractPermission(contratoId, allowedContractIds);
        await this.ensureContratoExists(contratoId);
      }

      if (
        matricula &&
        matricula.trim().toLowerCase() !==
          existingEletricista.matricula.toLowerCase()
      ) {
        await this.ensureUniqueMatricula(matricula.trim(), id);
      }

      const eletricista = await this.db.getPrisma().eletricista.update({
        where: { id },
        data: {
          ...(nome && { nome: nome.trim() }),
          ...(matricula && { matricula: matricula.trim() }),
          ...(telefone && { telefone: telefone.trim() }),
          ...(estado && {
            estado: estado.trim().toUpperCase(),
          }),
          ...(admissao && { admissao }),
          ...(cargoId && {
            cargo: { connect: { id: cargoId } },
          }),
          ...(contratoId && {
            contrato: { connect: { id: contratoId } },
          }),
          ...updateAuditData(userContext),
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

      this.logger.log(`Eletricista ${id} atualizado com sucesso`);
      return eletricista as EletricistaResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao atualizar eletricista ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar eletricista');
    }
  }

  async remove(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo eletricista ${id}`);
    this.validateEletricistaId(id);

    const userContext = this.getCurrentUserContext();
    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const eletricista = await this.db.getPrisma().eletricista.findFirst({
        where: { id, deletedAt: null },
      });

      if (!eletricista) {
        throw new NotFoundException(ERROR_MESSAGES.ELETRICISTA_NOT_FOUND);
      }

      this.ensureContractPermission(eletricista.contratoId, allowedContractIds);

      await this.db.getPrisma().eletricista.update({
        where: { id },
        data: deleteAuditData(userContext),
      });

      this.logger.log(`Eletricista ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao remover eletricista ${id}:`, error);
      throw new BadRequestException('Erro ao remover eletricista');
    }
  }

  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando eletricistas ativos');

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

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
      this.logger.error('Erro ao contar eletricistas:', error);
      throw new BadRequestException('Erro ao contar eletricistas');
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

  /**
   * Retorna todos os eletricistas para sincronização mobile
   * Respeitando as permissões de contrato do usuário
   */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaSyncDto[]> {
    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      this.logger.log('Nenhum contrato permitido, retornando lista vazia');
      return [];
    }

    try {
      const whereClause: any = {
        deletedAt: null,
        ...(allowedContractIds && {
          contratoId: { in: allowedContractIds },
        }),
      };

      const eletricistas = await this.db.getPrisma().eletricista.findMany({
        where: whereClause,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
      });

      this.logger.log(
        `Sincronização concluída - ${eletricistas.length} eletricistas retornados`
      );

      return eletricistas;
    } catch (error) {
      this.logger.error('Erro ao sincronizar eletricistas:', error);
      throw new BadRequestException('Erro ao sincronizar eletricistas');
    }
  }
}
