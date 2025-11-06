/**
 * Serviço de Veículos
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos veículos da operação, incluindo CRUD completo, validações,
 * auditoria e integração com permissões de contrato.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de veículos
 * - Validações de regras de negócio
 * - Integração com permissões de contrato
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * DIFERENCIAIS:
 * - Listagem restrita aos contratos permitidos para o usuário
 * - Validação de duplicidade de placa
 * - Verificação de existência de tipo de veículo e contrato
 * - Auditoria automática em todas as operações
 *
 * @example
 * ```typescript
 * // Listar veículos com restrição por contrato
 * const result = await veiculoService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'ABC',
 * }, allowedContracts);
 *
 * // Criar veículo com validação de permissões
 * const veiculo = await veiculoService.create(createDto, allowedContracts);
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
  buildPagination,
  buildPagedResponse,
  validatePaginationParams,
  buildPaginationMeta,
} from '@common/utils/pagination';
import { handleCrudError } from '@common/utils/error-handler';
import { handlePrismaUniqueError } from '@common/utils/error-handler';
import { validateId, validateOptionalId, ensureContratoExists, ensureTipoVeiculoExists } from '@common/utils/validation';
import {
  buildSearchWhereClause,
  buildContractFilter,
  buildBaseWhereClause,
} from '@common/utils/where-clause';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { ORDER_CONFIG } from '../constants/veiculo.constants';
import {
  CreateVeiculoDto,
  UpdateVeiculoDto,
  VeiculoListResponseDto,
  VeiculoResponseDto,
  VeiculoSyncDto,
} from '../dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

/**
 * Interface de parâmetros para consulta paginada interna
 */
interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  tipoVeiculoId?: number;
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
 * Serviço responsável pelas operações de veículos
 */
@Injectable()
export class VeiculoService {
  private readonly logger = new Logger(VeiculoService.name);

  constructor(private readonly db: DatabaseService) {}


  /**
   * Constrói filtros de consulta considerando busca, filtros e permissões
   */
  private buildWhereClause(
    search: string | undefined,
    tipoVeiculoId: number | undefined,
    contratoId: number | undefined,
    allowedContractIds: number[] | null
  ) {
    const whereClause: any = buildBaseWhereClause();

    // Adicionar busca
    const searchFilter = buildSearchWhereClause(search, {
      placa: true,
      modelo: true,
    });
    if (searchFilter) {
      Object.assign(whereClause, searchFilter);
    }

    // Adicionar filtro de tipo de veículo
    if (tipoVeiculoId) {
      whereClause.tipoVeiculoId = tipoVeiculoId;
    }

    // Adicionar filtro de contrato
    const contractFilter = buildContractFilter(contratoId, allowedContractIds);
    if (contractFilter) {
      Object.assign(whereClause, contractFilter);
    }

    return whereClause;
  }


  /**
   * Lista veículos com paginação e filtros, respeitando permissões
   *
   * @param params - Parâmetros de consulta (página, limite, busca, tipo, contrato)
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Lista paginada de veículos com metadados
   * @throws BadRequestException - Se parâmetros de paginação forem inválidos
   */
  async findAll(
    params: FindAllParams,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoListResponseDto> {
    const { page, limit, search, tipoVeiculoId, contratoId } = params;

    this.logger.log(
      `Listando veículos - Página: ${page}, Limite: ${limit}, Busca: ${
        search || 'N/A'
      }, TipoVeiculo: ${tipoVeiculoId ?? 'Todos'}, Contrato: ${
        contratoId ?? 'Todos'
      }`
    );

    validatePaginationParams(page, limit);
    validateOptionalId(tipoVeiculoId, 'ID do tipo de veículo');
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
        tipoVeiculoId,
        contratoId,
        allowedContractIds
      );

      const { skip, take, page: currPage, pageSize } = buildPagination({ page, pageSize: limit });

      const [data, total] = await Promise.all([
        this.db.getPrisma().veiculo.findMany({
          where: whereClause,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip,
          take,
          select: {
            id: true,
            placa: true,
            modelo: true,
            ano: true,
            tipoVeiculoId: true,
            tipoVeiculo: {
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
        this.db.getPrisma().veiculo.count({ where: whereClause }),
      ]);

      const meta: PaginationMetaDto = buildPaginationMeta(total, currPage, pageSize);
      return {
        data: data as VeiculoResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'veículos');
    }
  }

  /**
   * Lista veículos para sincronização mobile (sem paginação)
   *
   * Retorna todos os veículos ativos sem paginação para permitir
   * que clientes mobile mantenham seus dados em sincronia.
   *
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Lista completa de veículos ativos para sincronização
   */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoSyncDto[]> {
    this.logger.log('Sincronizando veículos para cliente mobile');
    this.logger.debug(
      `Contratos recebidos no service: ${JSON.stringify(allowedContracts)}`
    );
    this.logger.debug(
      `Tipo dos contratos no service: ${typeof allowedContracts}`
    );
    this.logger.debug(`É array no service: ${Array.isArray(allowedContracts)}`);

    const allowedContractIds = extractAllowedContractIds(allowedContracts);
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

      const data = await this.db.getPrisma().veiculo.findMany({
        where: whereClause,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          placa: true,
          modelo: true,
          ano: true,
          tipoVeiculoId: true,
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
        `Sincronização de veículos retornou ${data.length} registros`
      );
      this.logger.debug(
        `Dados retornados: ${JSON.stringify(data.slice(0, 2))}...`
      );
      return data as VeiculoSyncDto[];
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'veículos');
    }
  }

  /**
   * Busca veículo por ID respeitando permissões
   *
   * @param id - ID do veículo
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Dados do veículo encontrado
   * @throws NotFoundException - Se veículo não for encontrado
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Buscando veículo por ID: ${id}`);
    validateId(id, 'ID do veículo');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const veiculo = await this.db.getPrisma().veiculo.findFirst({
        where: {
          id,
          deletedAt: null,
        },
        select: {
          id: true,
          placa: true,
          modelo: true,
          ano: true,
          tipoVeiculoId: true,
          tipoVeiculo: {
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

      if (!veiculo) {
        this.logger.warn(`Veículo não encontrado: ${id}`);
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

  /**
   * Cria novo veículo com validações e auditoria
   *
   * @param createVeiculoDto - Dados do veículo a ser criado
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Veículo criado
   * @throws ConflictException - Se placa já existir
   * @throws NotFoundException - Se tipo de veículo ou contrato não forem encontrados
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async create(
    createVeiculoDto: CreateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { placa, modelo, ano, tipoVeiculoId, contratoId } = createVeiculoDto;
    const userContext = getDefaultUserContext();

    this.logger.log(
      `Criando veículo ${placa} - Contrato: ${contratoId}, Tipo: ${tipoVeiculoId}`
    );

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
        data: {
          placa: placa.toUpperCase(),
          modelo: modelo.trim(),
          ano,
          tipoVeiculo: { connect: { id: tipoVeiculoId } },
          contrato: { connect: { id: contratoId } },
          ...createAuditData(userContext),
        },
        select: {
          id: true,
          placa: true,
          modelo: true,
          ano: true,
          tipoVeiculoId: true,
          tipoVeiculo: {
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

      this.logger.log(`Veículo criado com sucesso - ID: ${veiculo.id}`);
      return veiculo as VeiculoResponseDto;
    } catch (error) {
      // Tratar erro de constraint única do Prisma primeiro
      handlePrismaUniqueError(error, this.logger, 'veículo');
      // Se não for erro de constraint única, tratar como erro CRUD genérico
      handleCrudError(error, this.logger, 'create', 'veículo');
    }
  }

  /**
   * Atualiza veículo existente com validações
   *
   * @param id - ID do veículo
   * @param updateVeiculoDto - Dados para atualização
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Veículo atualizado
   * @throws NotFoundException - Se veículo não for encontrado
   * @throws ConflictException - Se nova placa já existir
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
  async update(
    id: number,
    updateVeiculoDto: UpdateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { placa, modelo, ano, tipoVeiculoId, contratoId } = updateVeiculoDto;
    const userContext = getDefaultUserContext();

    this.logger.log(`Atualizando veículo ${id}`);
    validateId(id, 'ID do veículo');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    try {
      const existingVeiculo = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingVeiculo) {
        this.logger.warn(`Tentativa de atualizar veículo inexistente: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }

      ensureContractPermission(
        existingVeiculo.contratoId,
        allowedContractIds,
        ERROR_MESSAGES.FORBIDDEN_CONTRACT
      );

      if (contratoId && contratoId !== existingVeiculo.contratoId) {
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
        data: {
          ...(placa && { placa: placa.toUpperCase() }),
          ...(modelo && { modelo: modelo.trim() }),
          ...(ano && { ano }),
          ...(tipoVeiculoId && {
            tipoVeiculo: { connect: { id: tipoVeiculoId } },
          }),
          ...(contratoId && {
            contrato: { connect: { id: contratoId } },
          }),
          ...updateAuditData(userContext),
        },
        select: {
          id: true,
          placa: true,
          modelo: true,
          ano: true,
          tipoVeiculoId: true,
          tipoVeiculo: {
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

      this.logger.log(`Veículo ${id} atualizado com sucesso`);
      return veiculo as VeiculoResponseDto;
    } catch (error) {
      // Tratar erro de constraint única do Prisma primeiro
      handlePrismaUniqueError(error, this.logger, 'veículo');
      // Se não for erro de constraint única, tratar como erro CRUD genérico
      handleCrudError(error, this.logger, 'update', 'veículo');
    }
  }

  /**
   * Remove veículo (soft delete)
   *
   * @param id - ID do veículo
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @throws NotFoundException - Se veículo não for encontrado
   * @throws ForbiddenException - Se usuário não tiver permissão para o contrato
   */
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
        this.logger.warn(`Tentativa de remover veículo inexistente: ${id}`);
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

  /**
   * Conta total de veículos ativos respeitando permissões
   *
   * @param allowedContracts - Contratos permitidos para o usuário (opcional)
   * @returns Total de veículos ativos
   */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando veículos ativos');

    const allowedContractIds = extractAllowedContractIds(allowedContracts);

    if (allowedContractIds && allowedContractIds.length === 0) {
      return 0;
    }

    try {
      const count = await this.db.getPrisma().veiculo.count({
        where: {
          deletedAt: null,
          ...(allowedContractIds && {
            contratoId: { in: allowedContractIds },
          }),
        },
      });

      this.logger.log(`Total de veículos ativos: ${count}`);
      return count;
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'veículos');
    }
  }
}
