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
import { DbService } from '../../db/db.service';
import { ContractPermission } from '../engine/auth/service/contract-permissions.service';
import {
  AUDIT_CONFIG,
  ERROR_MESSAGES,
  ORDER_CONFIG,
  PAGINATION_CONFIG,
} from './constants/veiculo.constants';
import {
  CreateVeiculoDto,
  PaginationMetaDto,
  UpdateVeiculoDto,
  VeiculoListResponseDto,
  VeiculoResponseDto,
  VeiculoSyncDto,
} from './dto';

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

  constructor(private readonly db: DbService) {}

  /**
   * Valida parâmetros de paginação
   */
  private validatePaginationParams(page: number, limit: number): void {
    if (page < 1) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PAGE);
    }
    if (limit < 1 || limit > PAGINATION_CONFIG.MAX_LIMIT) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_LIMIT);
    }
  }

  /**
   * Valida ID de veículo
   */
  private validateVeiculoId(id: number): void {
    if (!id || !Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_ID);
    }
  }

  /**
   * Valida ID de tipo de veículo
   */
  private validateTipoVeiculoId(tipoVeiculoId?: number): void {
    if (
      tipoVeiculoId !== undefined &&
      (!Number.isInteger(tipoVeiculoId) || tipoVeiculoId <= 0)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_TIPO_VEICULO_ID);
    }
  }

  /**
   * Valida ID de contrato
   */
  private validateContratoId(contratoId?: number): void {
    if (
      contratoId !== undefined &&
      (!Number.isInteger(contratoId) || contratoId <= 0)
    ) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_CONTRATO_ID);
    }
  }

  /**
   * Obtém contexto do usuário (placeholder até integração com JWT)
   */
  private getCurrentUserContext(): UserContext {
    return {
      userId: AUDIT_CONFIG.DEFAULT_USER,
      userName: AUDIT_CONFIG.DEFAULT_USER_NAME,
      roles: AUDIT_CONFIG.DEFAULT_ROLES,
    };
  }

  /**
   * Extrai IDs de contratos permitidos a partir da lista de permissões
   */
  private extractAllowedContractIds(
    allowedContracts?: ContractPermission[]
  ): number[] | null {
    if (!allowedContracts) {
      return null;
    }

    const contractIds = allowedContracts
      .map(contract => contract?.contratoId)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    return contractIds;
  }

  /**
   * Garante que o usuário tenha permissão para acessar o contrato informado
   */
  private ensureContractPermission(
    contratoId: number,
    allowedContractIds: number[] | null
  ): void {
    if (allowedContractIds && !allowedContractIds.includes(contratoId)) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN_CONTRACT);
    }
  }

  /**
   * Constrói filtros de consulta considerando busca, filtros e permissões
   */
  private buildWhereClause(
    search: string | undefined,
    tipoVeiculoId: number | undefined,
    contratoId: number | undefined,
    allowedContractIds: number[] | null
  ) {
    const whereClause: any = {
      deletedAt: null,
    };

    if (search) {
      whereClause.OR = [
        {
          placa: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          modelo: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
      ];
    }

    if (tipoVeiculoId) {
      whereClause.tipoVeiculoId = tipoVeiculoId;
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

  /**
   * Constrói os metadados de paginação
   */
  private buildPaginationMeta(
    total: number,
    page: number,
    limit: number
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    return {
      total,
      page,
      limit,
      totalPages,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
    };
  }

  /**
   * Verifica duplicidade de placa
   */
  private async ensureUniquePlaca(
    placa: string,
    ignoreId?: number
  ): Promise<void> {
    const existing = await this.db.getPrisma().veiculo.findFirst({
      where: {
        placa,
        deletedAt: null,
        ...(ignoreId && { NOT: { id: ignoreId } }),
      },
    });

    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.PLACA_DUPLICATE);
    }
  }

  /**
   * Valida existência de tipo de veículo
   */
  private async ensureTipoVeiculoExists(tipoVeiculoId: number): Promise<void> {
    const tipoVeiculo = await this.db.getPrisma().tipoVeiculo.findFirst({
      where: {
        id: tipoVeiculoId,
        deletedAt: null,
      },
    });

    if (!tipoVeiculo) {
      throw new NotFoundException(ERROR_MESSAGES.TIPO_VEICULO_NOT_FOUND);
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
   * Lista veículos com paginação e filtros, respeitando permissões
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

    this.validatePaginationParams(page, limit);
    this.validateTipoVeiculoId(tipoVeiculoId);
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
        tipoVeiculoId,
        contratoId,
        allowedContractIds
      );

      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.db.getPrisma().veiculo.findMany({
          where: whereClause,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip,
          take: limit,
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

      const meta = this.buildPaginationMeta(total, page, limit);

      return {
        data: data as VeiculoResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Erro ao listar veículos:', error);
      throw new BadRequestException('Erro ao listar veículos');
    }
  }

  /**
   * Lista veículos para sincronização mobile (sem paginação)
   */
  async findAllForSync(
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoSyncDto[]> {
    this.logger.log('Sincronizando veículos para cliente mobile');
    this.logger.debug(`Contratos recebidos no service: ${JSON.stringify(allowedContracts)}`);
    this.logger.debug(`Tipo dos contratos no service: ${typeof allowedContracts}`);
    this.logger.debug(`É array no service: ${Array.isArray(allowedContracts)}`);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.logger.debug(`IDs de contratos extraídos: ${JSON.stringify(allowedContractIds)}`);

    if (allowedContractIds && allowedContractIds.length === 0) {
      this.logger.warn('Nenhum contrato permitido encontrado, retornando array vazio');
      return [];
    }

    try {
      const whereClause = {
        deletedAt: null,
        ...(allowedContractIds && {
          contratoId: { in: allowedContractIds },
        }),
      };

      this.logger.debug(`Where clause para busca: ${JSON.stringify(whereClause)}`);

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
      this.logger.debug(`Dados retornados: ${JSON.stringify(data.slice(0, 2))}...`);
      return data as VeiculoSyncDto[];
    } catch (error) {
      this.logger.error('Erro ao sincronizar veículos:', error);
      this.logger.error(`Stack trace:`, error.stack);
      throw new BadRequestException('Erro ao sincronizar veículos');
    }
  }

  /**
   * Busca veículo por ID respeitando permissões
   */
  async findOne(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    this.logger.log(`Buscando veículo por ID: ${id}`);
    this.validateVeiculoId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

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

      this.ensureContractPermission(veiculo.contratoId, allowedContractIds);

      return veiculo as VeiculoResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao buscar veículo ${id}:`, error);
      throw new BadRequestException('Erro ao buscar veículo');
    }
  }

  /**
   * Cria novo veículo com validações e auditoria
   */
  async create(
    createVeiculoDto: CreateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { placa, modelo, ano, tipoVeiculoId, contratoId } = createVeiculoDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(
      `Criando veículo ${placa} - Contrato: ${contratoId}, Tipo: ${tipoVeiculoId}`
    );

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.ensureContractPermission(contratoId, allowedContractIds);

    try {
      await this.ensureUniquePlaca(placa.toUpperCase());
      await this.ensureTipoVeiculoExists(tipoVeiculoId);
      await this.ensureContratoExists(contratoId);

      const veiculo = await this.db.getPrisma().veiculo.create({
        data: {
          placa: placa.toUpperCase(),
          modelo: modelo.trim(),
          ano,
          tipoVeiculo: { connect: { id: tipoVeiculoId } },
          contrato: { connect: { id: contratoId } },
          createdAt: new Date(),
          createdBy: userContext.userId,
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
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error('Erro ao criar veículo:', error);
      throw new BadRequestException('Erro ao criar veículo');
    }
  }

  /**
   * Atualiza veículo existente com validações
   */
  async update(
    id: number,
    updateVeiculoDto: UpdateVeiculoDto,
    allowedContracts?: ContractPermission[]
  ): Promise<VeiculoResponseDto> {
    const { placa, modelo, ano, tipoVeiculoId, contratoId } = updateVeiculoDto;
    const userContext = this.getCurrentUserContext();

    this.logger.log(`Atualizando veículo ${id}`);
    this.validateVeiculoId(id);

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const existingVeiculo = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingVeiculo) {
        this.logger.warn(`Tentativa de atualizar veículo inexistente: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }

      this.ensureContractPermission(
        existingVeiculo.contratoId,
        allowedContractIds
      );

      if (contratoId && contratoId !== existingVeiculo.contratoId) {
        this.ensureContractPermission(contratoId, allowedContractIds);
        await this.ensureContratoExists(contratoId);
      }

      if (tipoVeiculoId) {
        await this.ensureTipoVeiculoExists(tipoVeiculoId);
      }

      if (placa && placa.toUpperCase() !== existingVeiculo.placa) {
        await this.ensureUniquePlaca(placa.toUpperCase(), id);
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
          updatedAt: new Date(),
          updatedBy: userContext.userId,
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
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao atualizar veículo ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar veículo');
    }
  }

  /**
   * Remove veículo (soft delete)
   */
  async remove(
    id: number,
    allowedContracts?: ContractPermission[]
  ): Promise<void> {
    this.logger.log(`Removendo veículo ${id}`);
    this.validateVeiculoId(id);

    const userContext = this.getCurrentUserContext();
    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

    try {
      const veiculo = await this.db.getPrisma().veiculo.findFirst({
        where: { id, deletedAt: null },
      });

      if (!veiculo) {
        this.logger.warn(`Tentativa de remover veículo inexistente: ${id}`);
        throw new NotFoundException(ERROR_MESSAGES.VEICULO_NOT_FOUND);
      }

      this.ensureContractPermission(veiculo.contratoId, allowedContractIds);

      await this.db.getPrisma().veiculo.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: userContext.userId,
        },
      });

      this.logger.log(`Veículo ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Erro ao remover veículo ${id}:`, error);
      throw new BadRequestException('Erro ao remover veículo');
    }
  }

  /**
   * Conta total de veículos ativos respeitando permissões
   */
  async count(allowedContracts?: ContractPermission[]): Promise<number> {
    this.logger.log('Contando veículos ativos');

    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);

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
      this.logger.error('Erro ao contar veículos:', error);
      throw new BadRequestException('Erro ao contar veículos');
    }
  }
}
