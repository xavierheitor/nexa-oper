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
  extractAllowedContractIds as sharedExtractAllowedContractIds,
  ensureContractPermission as sharedEnsureContractPermission,
} from '../engine/auth/utils/contract-helpers';
import {
  buildPaginationMeta,
  validatePaginationParams,
} from '../../shared/utils/pagination';
import {
  validateId,
  validateOptionalId,
  validateTelefoneFormat,
  validateEstadoFormat,
} from '../../shared/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '../../shared/utils/audit';
import { ERROR_MESSAGES } from '../../shared/constants/errors';
import {
  ELETRICISTA_VALIDATION_CONFIG,
  ORDER_CONFIG,
  PAGINATION_CONFIG,
} from './constants/eletricista.constants';
import {
  CreateEletricistaDto,
  EletricistaListResponseDto,
  EletricistaQueryDto,
  EletricistaResponseDto,
  EletricistaSyncDto,
  PaginationMetaDto,
  UpdateEletricistaDto,
} from './dto';

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

  constructor(private readonly db: DbService) {}

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
    return sharedExtractAllowedContractIds(allowedContracts);
  }

  private ensureContractPermission(
    contratoId: number,
    allowedContractIds: number[] | null
  ): void {
    sharedEnsureContractPermission(
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
          contrato: { connect: { id: contratoId } },
          ...createAuditData(userContext),
        },
        select: {
          id: true,
          nome: true,
          matricula: true,
          telefone: true,
          estado: true,
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
    const { nome, matricula, telefone, estado, contratoId } =
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
    this.logger.debug('=== INÍCIO DO MÉTODO findAllForSync ===');
    this.logger.debug(`Timestamp: ${new Date().toISOString()}`);
    this.logger.debug(`Método: ${this.findAllForSync.name}`);
    this.logger.debug(`Service: ${EletricistaService.name}`);

    this.logger.debug('=== PARÂMETROS RECEBIDOS NO SERVICE ===');
    this.logger.debug(
      `allowedContracts recebido: ${JSON.stringify(allowedContracts)}`
    );
    this.logger.debug(`Tipo de allowedContracts: ${typeof allowedContracts}`);
    this.logger.debug(`É array: ${Array.isArray(allowedContracts)}`);
    this.logger.debug(
      `Quantidade de contratos: ${allowedContracts?.length || 0}`
    );

    this.logger.log(
      `Sincronizando eletricistas para ${allowedContracts?.length || 0} contratos`
    );

    this.logger.debug('=== EXTRAINDO IDs DOS CONTRATOS ===');
    const allowedContractIds = this.extractAllowedContractIds(allowedContracts);
    this.logger.debug(
      `allowedContractIds extraídos: ${JSON.stringify(allowedContractIds)}`
    );
    this.logger.debug(
      `Tipo de allowedContractIds: ${typeof allowedContractIds}`
    );
    this.logger.debug(`É array: ${Array.isArray(allowedContractIds)}`);
    this.logger.debug(`Quantidade de IDs: ${allowedContractIds?.length || 0}`);

    if (allowedContractIds && allowedContractIds.length === 0) {
      this.logger.log('Nenhum contrato permitido, retornando lista vazia');
      this.logger.debug('=== RETORNANDO LISTA VAZIA ===');
      return [];
    }

    try {
      this.logger.debug('=== CONSTRUINDO WHERE CLAUSE ===');
      const whereClause: any = {
        deletedAt: null,
      };

      if (allowedContractIds) {
        whereClause.contratoId = {
          in: allowedContractIds,
        };
      }

      this.logger.debug(
        `Where clause construída: ${JSON.stringify(whereClause)}`
      );
      this.logger.debug(
        `ORDER_CONFIG.SYNC_ORDER: ${JSON.stringify(ORDER_CONFIG.SYNC_ORDER)}`
      );

      this.logger.debug('=== EXECUTANDO QUERY NO BANCO ===');
      this.logger.debug('Chamando db.getPrisma().eletricista.findMany...');

      const eletricistas = await this.db.getPrisma().eletricista.findMany({
        where: whereClause,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
      });

      this.logger.debug('=== RESULTADO DA QUERY ===');
      this.logger.debug(`Query executada com sucesso`);
      this.logger.debug(
        `Quantidade de eletricistas retornados: ${eletricistas.length}`
      );
      this.logger.debug(`Tipo do resultado: ${typeof eletricistas}`);
      this.logger.debug(`É array: ${Array.isArray(eletricistas)}`);

      if (eletricistas.length > 0) {
        this.logger.debug('=== DETALHES DOS ELETRICISTAS ===');
        eletricistas.forEach((eletricista, index) => {
          this.logger.debug(
            `Eletricista ${index + 1}: ${JSON.stringify(eletricista)}`
          );
        });
      }

      this.logger.log(
        `Sincronização concluída - ${eletricistas.length} eletricistas retornados`
      );

      this.logger.debug('=== RETORNANDO RESULTADO DO SERVICE ===');
      this.logger.debug('=== FIM DO MÉTODO findAllForSync ===');

      return eletricistas;
    } catch (error) {
      this.logger.error('=== ERRO NO SERVICE ===');
      this.logger.error(`Erro capturado: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      this.logger.error(`Nome do erro: ${error.name}`);
      this.logger.error(`Código do erro: ${error.code}`);
      this.logger.error(`Tipo do erro: ${typeof error}`);
      this.logger.error('=== FIM DO ERRO NO SERVICE ===');
      throw new BadRequestException('Erro ao sincronizar eletricistas');
    }
  }
}
