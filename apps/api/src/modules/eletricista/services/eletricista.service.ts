import { ERROR_MESSAGES } from '@common/constants/errors';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { handleCrudError } from '@common/utils/error-handler';
import { handlePrismaUniqueError } from '@common/utils/error-handler';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '@common/utils/pagination';
import {
  validateId,
  validateOptionalId,
  validateEstadoFormat,
  ensureContratoExists,
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
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  ORDER_CONFIG,
  PAGINATION_CONFIG,
} from '@common/constants/eletricista';
import {
  CreateEletricistaDto,
  EletricistaListResponseDto,
  EletricistaQueryDto,
  EletricistaResponseDto,
  EletricistaSyncDto,
  UpdateEletricistaDto,
} from '../dto';

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

      const meta = buildPaginationMeta(total, page, limit);

      return {
        data: data as EletricistaResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };
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
   * Cria novo eletricista com validações e auditoria
   *
   * @param createEletricistaDto - Dados do eletricista a ser criado
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Eletricista criado
   * @throws ConflictException - Se matrícula já existir
   * @throws NotFoundException - Se contrato não for encontrado
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async create(
    createEletricistaDto: CreateEletricistaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    const { nome, matricula, telefone, estado, contratoId } =
      createEletricistaDto;
    const userContext = getDefaultUserContext();

    this.logger.log(
      `Criando eletricista ${matricula} - Contrato: ${contratoId}`
    );

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    ensureContractPermission(
      contratoId,
      allowedContractIds,
      ERROR_MESSAGES.FORBIDDEN_CONTRACT
    );

    try {
      await ensureContratoExists(this.db.getPrisma(), contratoId);

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
      // Tratar erro de constraint única do Prisma primeiro
      handlePrismaUniqueError(error, this.logger, 'eletricista');
      // Se não for erro de constraint única, tratar como erro CRUD genérico
      handleCrudError(error, this.logger, 'create', 'eletricista');
    }
  }

  /**
   * Atualiza eletricista existente com validações
   *
   * @param id - ID do eletricista
   * @param updateEletricistaDto - Dados para atualização
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Eletricista atualizado
   * @throws NotFoundException - Se eletricista não for encontrado
   * @throws ConflictException - Se nova matrícula já existir
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async update(
    id: number,
    updateEletricistaDto: UpdateEletricistaDto,
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaResponseDto> {
    const { nome, matricula, telefone, estado, admissao, cargoId, contratoId } =
      updateEletricistaDto;
    const userContext = getDefaultUserContext();

    this.logger.log(`Atualizando eletricista ${id}`);
    validateId(id, 'ID do eletricista');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const existingEletricista = await this.db
        .getPrisma()
        .eletricista.findFirst({
          where: { id, deletedAt: null },
        });

      if (!existingEletricista) {
        throw new NotFoundException(ERROR_MESSAGES.ELETRICISTA_NOT_FOUND);
      }

      ensureContractPermission(
        existingEletricista.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );

      if (contratoId && contratoId !== existingEletricista.contratoId) {
        ensureContractPermission(
          contratoId,
          allowedContractIds,
          ERROR_MESSAGES.FORBIDDEN_CONTRACT
        );
        await ensureContratoExists(this.db.getPrisma(), contratoId);
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
      // Tratar erro de constraint única do Prisma primeiro
      handlePrismaUniqueError(error, this.logger, 'eletricista');
      // Se não for erro de constraint única, tratar como erro CRUD genérico
      handleCrudError(error, this.logger, 'update', 'eletricista');
    }
  }

  /**
   * Remove eletricista (soft delete)
   *
   * @param id - ID do eletricista
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @throws NotFoundException - Se eletricista não for encontrado
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async remove(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo eletricista ${id}`);
    validateId(id, 'ID do eletricista');

    const userContext = getDefaultUserContext();
    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const eletricista = await this.db.getPrisma().eletricista.findFirst({
        where: { id, deletedAt: null },
      });

      if (!eletricista) {
        throw new NotFoundException(ERROR_MESSAGES.ELETRICISTA_NOT_FOUND);
      }

      ensureContractPermission(
        eletricista.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );

      await this.db.getPrisma().eletricista.update({
        where: { id },
        data: deleteAuditData(userContext),
      });

      this.logger.log(`Eletricista ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'eletricista');
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

  /**
   * Lista todos os eletricistas ativos para sincronização mobile
   *
   * Retorna todos os eletricistas ativos sem paginação para permitir
   * que clientes mobile mantenham seus dados em sincronia.
   *
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Lista completa de eletricistas ativos para sincronização
   */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<EletricistaSyncDto[]> {
    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

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
      handleCrudError(error, this.logger, 'sync', 'eletricistas');
    }
  }
}
