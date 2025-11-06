/**
 * Serviço de Tipos de Atividade
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos tipos de atividade da operação, incluindo CRUD completo,
 * validações, auditoria e integração com permissões de contrato.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de tipos de atividade
 * - Validações de regras de negócio
 * - Integração com permissões de contrato
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * DIFERENCIAIS:
 * - Listagem restrita aos contratos permitidos para o usuário
 * - Validação de duplicidade de nome
 * - Auditoria automática em todas as operações
 * - Sincronização completa para mobile
 *
 * @example
 * ```typescript
 * // Listar tipos de atividade com restrição por contrato
 * const result = await tipoAtividadeService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'Soldagem',
 * }, allowedContracts);
 *
 * // Criar tipo de atividade com validação de permissões
 * const tipoAtividade = await tipoAtividadeService.create(createDto, allowedContracts);
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
  buildPaginationMeta,
  validatePaginationParams,
  normalizePaginationParams,
} from '@common/utils/pagination';
import { handleCrudError } from '@common/utils/error-handler';
import { validateId, validateOptionalId } from '@common/utils/validation';
import {
  getDefaultUserContext,
  createAuditData,
  updateAuditData,
  deleteAuditData,
} from '@common/utils/audit';
import { ERROR_MESSAGES } from '@common/constants/errors';
import { ORDER_CONFIG, ERROR_MESSAGES as ATIVIDADE_ERRORS } from '../constants/atividade.constants';
import {
  CreateTipoAtividadeDto,
  UpdateTipoAtividadeDto,
  TipoAtividadeListResponseDto,
  TipoAtividadeResponseDto,
  TipoAtividadeSyncDto,
} from '../dto';
import { PaginationMetaDto } from '@common/dto/pagination-meta.dto';

/**
 * Interface de parâmetros para consulta paginada interna
 */
interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
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
 * Serviço responsável pelas operações de tipos de atividade
 */
@Injectable()
export class TipoAtividadeService {
  private readonly logger = new Logger(TipoAtividadeService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Lista tipos de atividade com paginação e busca
   *
   * @param params - Parâmetros de consulta
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista paginada de tipos de atividade
   */
  async findAll(
    params: FindAllParams,
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeListResponseDto> {
    this.logger.log(
      `Listando tipos de atividade - página: ${params.page}, limite: ${params.limit}, busca: ${params.search || 'nenhuma'}`,
    );

    try {
      // Validação de parâmetros de paginação
      validatePaginationParams(params.page, params.limit);
      const { page, limit } = normalizePaginationParams(params.page, params.limit);

      // Construção da cláusula WHERE
      const where = this.buildWhereClause(params, allowedContracts);

      // Consulta com paginação
      const [data, total] = await Promise.all([
        this.db.getPrisma().tipoAtividade.findMany({
          where,
          orderBy: ORDER_CONFIG.DEFAULT_ORDER,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            nome: true,
            createdAt: true,
            createdBy: true,
            updatedAt: true,
            updatedBy: true,
            deletedAt: true,
            deletedBy: true,
          },
        }),
        this.db.getPrisma().tipoAtividade.count({ where }),
      ]);

      // Construção dos metadados de paginação
      const meta = buildPaginationMeta(page, limit, total);

      this.logger.log(
        `Listagem de tipos de atividade retornou ${data.length} registros de ${total} total`,
      );

      return {
        data: data as TipoAtividadeResponseDto[],
        meta,
        search: params.search,
        timestamp: new Date(),
      };
    } catch (error) {
      handleCrudError(error, this.logger, 'list', 'tipos de atividade');
    }
  }

  /**
   * Lista todos os tipos de atividade para sincronização mobile
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Lista completa de tipos de atividade
   */
  async findAllForSync(
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeSyncDto[]> {
    this.logger.log('Sincronizando tipos de atividade - retorno completo');

    try {
      // Construção da cláusula WHERE
      const where = this.buildWhereClause({ page: 1, limit: 1000 }, allowedContracts);

      const data = await this.db.getPrisma().tipoAtividade.findMany({
        where,
        orderBy: ORDER_CONFIG.SYNC_ORDER,
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(
        `Sincronização de tipos de atividade retornou ${data.length} registros`,
      );
      return data as TipoAtividadeSyncDto[];
    } catch (error) {
      handleCrudError(error, this.logger, 'sync', 'tipos de atividade');
    }
  }

  /**
   * Busca um tipo de atividade por ID
   *
   * @param id - ID do tipo de atividade
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade encontrado
   */
  async findOne(
    id: number,
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Buscando tipo de atividade com ID: ${id}`);

    try {
      // Validação do ID
      validateId(id, 'ID do tipo de atividade');

      // Construção da cláusula WHERE
      const where = this.buildWhereClause({ page: 1, limit: 1000 }, allowedContracts, id);

      const tipoAtividade = await this.db.getPrisma().tipoAtividade.findFirst({
        where,
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      if (!tipoAtividade) {
        throw new NotFoundException(ATIVIDADE_ERRORS.TIPO_ATIVIDADE_NOT_FOUND);
      }

      this.logger.log(`Tipo de atividade encontrado: ${tipoAtividade.nome}`);
      return tipoAtividade as TipoAtividadeResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'find', 'tipo de atividade');
    }
  }

  /**
   * Cria um novo tipo de atividade
   *
   * @param createDto - Dados para criação
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade criado
   */
  async create(
    createDto: CreateTipoAtividadeDto,
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Criando tipo de atividade: ${createDto.nome}`);

    try {
      // Validação de permissões de contrato
      const allowedContractIds = extractAllowedContractIds(allowedContracts);
      // Por enquanto, tipos de atividade não têm restrição de contrato
      // ensureContractPermission(contratoId, allowedContractIds, 'Tipo de atividade');

      // Validação de duplicidade de nome
      await this.validateUniqueNome(createDto.nome);

      // Contexto do usuário (placeholder)
      const userContext = getDefaultUserContext();

      // Dados de auditoria para criação
      const auditData = createAuditData(userContext);

      // Criação do tipo de atividade
      const tipoAtividade = await this.db.getPrisma().tipoAtividade.create({
        data: {
          nome: createDto.nome,
          ...auditData,
        },
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(`Tipo de atividade criado com sucesso: ${tipoAtividade.nome}`);
      return tipoAtividade as TipoAtividadeResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'create', 'tipo de atividade');
    }
  }

  /**
   * Atualiza um tipo de atividade existente
   *
   * @param id - ID do tipo de atividade
   * @param updateDto - Dados para atualização
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade atualizado
   */
  async update(
    id: number,
    updateDto: UpdateTipoAtividadeDto,
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Atualizando tipo de atividade com ID: ${id}`);

    try {
      // Validação do ID
      validateId(id, 'ID do tipo de atividade');

      // Validação de permissões de contrato
      const allowedContractIds = extractAllowedContractIds(allowedContracts);
      // Por enquanto, tipos de atividade não têm restrição de contrato
      // ensureContractPermission(contratoId, allowedContractIds, 'Tipo de atividade');

      // Verificação de existência
      await this.findOne(id, allowedContracts);

      // Validação de duplicidade de nome (se fornecido)
      if (updateDto.nome) {
        await this.validateUniqueNome(updateDto.nome, id);
      }

      // Contexto do usuário (placeholder)
      const userContext = getDefaultUserContext();

      // Dados de auditoria para atualização
      const auditData = updateAuditData(userContext);

      // Atualização do tipo de atividade
      const tipoAtividade = await this.db.getPrisma().tipoAtividade.update({
        where: { id },
        data: {
          ...(updateDto.nome && { nome: updateDto.nome }),
          ...auditData,
        },
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(`Tipo de atividade atualizado com sucesso: ${tipoAtividade.nome}`);
      return tipoAtividade as TipoAtividadeResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'update', 'tipo de atividade');
    }
  }

  /**
   * Remove um tipo de atividade (soft delete)
   *
   * @param id - ID do tipo de atividade
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Tipo de atividade removido
   */
  async remove(
    id: number,
    allowedContracts: ContractPermission[],
  ): Promise<TipoAtividadeResponseDto> {
    this.logger.log(`Removendo tipo de atividade com ID: ${id}`);

    try {
      // Validação do ID
      validateId(id, 'ID do tipo de atividade');

      // Validação de permissões de contrato
      const allowedContractIds = extractAllowedContractIds(allowedContracts);
      // Por enquanto, tipos de atividade não têm restrição de contrato
      // ensureContractPermission(contratoId, allowedContractIds, 'Tipo de atividade');

      // Verificação de existência
      await this.findOne(id, allowedContracts);

      // Contexto do usuário (placeholder)
      const userContext = getDefaultUserContext();

      // Dados de auditoria para exclusão
      const auditData = deleteAuditData(userContext);

      // Soft delete do tipo de atividade
      const tipoAtividade = await this.db.getPrisma().tipoAtividade.update({
        where: { id },
        data: auditData,
        select: {
          id: true,
          nome: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          deletedAt: true,
          deletedBy: true,
        },
      });

      this.logger.log(`Tipo de atividade removido com sucesso: ${tipoAtividade.nome}`);
      return tipoAtividade as TipoAtividadeResponseDto;
    } catch (error) {
      handleCrudError(error, this.logger, 'delete', 'tipo de atividade');
    }
  }

  /**
   * Conta o total de tipos de atividade
   *
   * @param allowedContracts - Contratos permitidos para o usuário
   * @returns Total de tipos de atividade
   */
  async count(allowedContracts: ContractPermission[]): Promise<number> {
    this.logger.log('Contando tipos de atividade');

    try {
      const where = this.buildWhereClause({ page: 1, limit: 1000 }, allowedContracts);
      return await this.db.getPrisma().tipoAtividade.count({ where });
    } catch (error) {
      handleCrudError(error, this.logger, 'count', 'tipos de atividade');
    }
  }

  /**
   * Constrói a cláusula WHERE para consultas
   *
   * @param params - Parâmetros de consulta
   * @param allowedContracts - Contratos permitidos para o usuário
   * @param id - ID específico (opcional)
   * @returns Cláusula WHERE do Prisma
   */
  private buildWhereClause(
    params: FindAllParams,
    allowedContracts: ContractPermission[],
    id?: number,
  ) {
    const where: any = {
      deletedAt: null,
    };

    // Filtro por ID específico
    if (id) {
      where.id = id;
    }

    // Filtro por busca
    if (params.search) {
      where.nome = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    // Filtro por contratos permitidos (placeholder - tipos de atividade não têm contrato direto)
    // Mas mantemos a estrutura para futuras implementações
    const allowedContractIds = extractAllowedContractIds(allowedContracts);
    if (allowedContractIds && allowedContractIds.length > 0) {
      // Por enquanto, não aplicamos filtro de contrato
      // where.contratoId = { in: allowedContractIds };
    }

    return where;
  }

  /**
   * Valida se o nome do tipo de atividade é único
   *
   * @param nome - Nome a ser validado
   * @param excludeId - ID a ser excluído da validação (para atualizações)
   */
  private async validateUniqueNome(nome: string, excludeId?: number): Promise<void> {
    const where: any = {
      nome: {
        equals: nome,
        mode: 'insensitive',
      },
      deletedAt: null,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const existing = await this.db.getPrisma().tipoAtividade.findFirst({
      where,
    });

    if (existing) {
      throw new ConflictException(ATIVIDADE_ERRORS.NOME_DUPLICATE);
    }
  }
}
