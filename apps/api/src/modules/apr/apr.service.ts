/**
 * Serviço de APR (Análise Preliminar de Risco)
 *
 * Este serviço implementa toda a lógica de negócio relacionada
 * aos modelos de APR, incluindo CRUD completo e validações.
 *
 * RESPONSABILIDADES:
 * - Operações CRUD de modelos APR
 * - Validações de regras de negócio
 * - Transformação de dados entre DTOs e entidades
 * - Logging estruturado de operações
 * - Tratamento de erros específicos
 * - Integração com banco de dados via Prisma
 *
 * FUNCIONALIDADES:
 * - Listagem paginada com busca
 * - Criação com validação de duplicatas
 * - Atualização com auditoria
 * - Soft delete com preservação de dados
 * - Busca por ID com relacionamentos
 * - Contagem e estatísticas
 *
 * PADRÕES IMPLEMENTADOS:
 * - Injeção de dependência
 * - Logging estruturado
 * - Tratamento de exceções
 * - Transformação de DTOs
 * - Validações de negócio
 * - Auditoria automática
 *
 * @example
 * ```typescript
 * // Listar modelos com paginação
 * const result = await aprService.findAll({
 *   page: 1,
 *   limit: 10,
 *   search: 'soldagem'
 * });
 *
 * // Criar novo modelo
 * const apr = await aprService.create({
 *   nome: 'APR Soldagem Industrial'
 * });
 * ```
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../../db/db.service';
import {
  AprListResponseDto,
  AprResponseDto,
  CreateAprDto,
  PaginationMetaDto,
  UpdateAprDto,
} from './dto/apr.dto';

/**
 * Interface para parâmetros de consulta interna
 */
interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Serviço de APR (Análise Preliminar de Risco)
 *
 * Implementa toda a lógica de negócio para gerenciamento
 * de modelos de APR com validações e auditoria completas.
 */
@Injectable()
export class AprService {
  private readonly logger = new Logger(AprService.name);

  constructor(private readonly db: DbService) {}

  /**
   * Lista todos os modelos de APR com paginação e busca
   *
   * Retorna uma lista paginada de modelos APR aplicando filtros
   * de busca por nome e ordenação por data de criação.
   *
   * @param params - Parâmetros de consulta (página, limite, busca)
   * @returns Lista paginada de modelos APR
   *
   * @throws {BadRequestException} Se os parâmetros forem inválidos
   *
   * @example
   * ```typescript
   * const result = await aprService.findAll({
   *   page: 1,
   *   limit: 10,
   *   search: 'soldagem'
   * });
   *
   * console.log(`Encontrados ${result.meta.total} modelos`);
   * ```
   */
  async findAll(params: FindAllParams): Promise<AprListResponseDto> {
    const { page, limit, search } = params;

    this.logger.log(
      `Buscando modelos APR - Página: ${page}, Limite: ${limit}, Busca: ${search || 'N/A'}`
    );

    try {
      // Construir filtros de busca
      const whereClause = {
        deletedAt: null, // Apenas registros ativos
        ...(search && {
          nome: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
      };

      // Calcular offset para paginação
      const skip = (page - 1) * limit;

      // Executar consultas em paralelo para otimização
      const [data, total] = await Promise.all([
        // Buscar dados paginados
        this.db.getPrisma().apr.findMany({
          where: whereClause,
          orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          skip,
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

        // Contar total de registros
        this.db.getPrisma().apr.count({
          where: whereClause,
        }),
      ]);

      // Calcular metadados de paginação
      const totalPages = Math.ceil(total / limit);
      const hasPrevious = page > 1;
      const hasNext = page < totalPages;

      const meta: PaginationMetaDto = {
        total,
        page,
        limit,
        totalPages,
        hasPrevious,
        hasNext,
      };

      const result: AprListResponseDto = {
        data: data as AprResponseDto[],
        meta,
        search,
        timestamp: new Date(),
      };

      this.logger.log(
        `Encontrados ${total} modelos APR (${data.length} nesta página)`
      );
      return result;
    } catch (error) {
      this.logger.error('Erro ao buscar modelos APR:', error);
      throw new BadRequestException('Erro ao buscar modelos APR');
    }
  }

  /**
   * Busca modelo de APR por ID
   *
   * Retorna um modelo específico de APR baseado no ID fornecido,
   * incluindo validação de existência e status ativo.
   *
   * @param id - ID único do modelo APR
   * @returns Modelo APR encontrado
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {BadRequestException} Se o ID for inválido
   *
   * @example
   * ```typescript
   * const apr = await aprService.findOne(1);
   * console.log(`Modelo encontrado: ${apr.nome}`);
   * ```
   */
  async findOne(id: number): Promise<AprResponseDto> {
    this.logger.log(`Buscando modelo APR por ID: ${id}`);

    // Validar ID
    if (!id || id <= 0) {
      throw new BadRequestException(
        'ID do modelo APR deve ser um número positivo'
      );
    }

    try {
      const apr = await this.db.getPrisma().apr.findFirst({
        where: {
          id,
          deletedAt: null, // Apenas registros ativos
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

      if (!apr) {
        this.logger.warn(`Modelo APR não encontrado: ${id}`);
        throw new NotFoundException(`Modelo APR com ID ${id} não encontrado`);
      }

      this.logger.log(`Modelo APR encontrado: ${apr.nome} (ID: ${id})`);
      return apr as AprResponseDto;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao buscar modelo APR');
    }
  }

  /**
   * Cria novo modelo de APR
   *
   * Cria um novo modelo de APR no sistema com validação
   * de duplicatas por nome e auditoria automática.
   *
   * @param createAprDto - Dados do novo modelo APR
   * @returns Modelo APR criado
   *
   * @throws {ConflictException} Se já existir modelo com o mesmo nome
   * @throws {BadRequestException} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const apr = await aprService.create({
   *   nome: 'APR Soldagem Industrial'
   * });
   *
   * console.log(`Modelo criado com ID: ${apr.id}`);
   * ```
   */
  async create(createAprDto: CreateAprDto): Promise<AprResponseDto> {
    const { nome } = createAprDto;

    this.logger.log(`Criando novo modelo APR: ${nome}`);

    try {
      // Verificar se já existe modelo com o mesmo nome
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: {
          nome: nome.trim(),
          deletedAt: null,
        },
      });

      if (existingApr) {
        this.logger.warn(`Tentativa de criar modelo APR duplicado: ${nome}`);
        throw new ConflictException(
          `Já existe um modelo APR com o nome "${nome}"`
        );
      }

      // Criar novo modelo APR
      const apr = await this.db.getPrisma().apr.create({
        data: {
          nome: nome.trim(),
          createdAt: new Date(),
          createdBy: 'system', // TODO: Implementar autenticação para obter usuário real
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

      this.logger.log(
        `Modelo APR criado com sucesso - ID: ${apr.id}, Nome: ${apr.nome}`
      );
      return apr as AprResponseDto;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Erro ao criar modelo APR:', error);
      throw new BadRequestException('Erro ao criar modelo APR');
    }
  }

  /**
   * Atualiza modelo de APR existente
   *
   * Atualiza um modelo de APR existente com os novos dados,
   * incluindo validação de existência e auditoria.
   *
   * @param id - ID do modelo APR a ser atualizado
   * @param updateAprDto - Novos dados do modelo APR
   * @returns Modelo APR atualizado
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {ConflictException} Se o novo nome já existir
   * @throws {BadRequestException} Se os dados forem inválidos
   *
   * @example
   * ```typescript
   * const apr = await aprService.update(1, {
   *   nome: 'APR Soldagem Industrial Atualizada'
   * });
   *
   * console.log(`Modelo atualizado: ${apr.nome}`);
   * ```
   */
  async update(
    id: number,
    updateAprDto: UpdateAprDto
  ): Promise<AprResponseDto> {
    const { nome } = updateAprDto;

    this.logger.log(`Atualizando modelo APR ${id}: ${nome || 'N/A'}`);

    // Validar ID
    if (!id || id <= 0) {
      throw new BadRequestException(
        'ID do modelo APR deve ser um número positivo'
      );
    }

    try {
      // Verificar se o modelo existe
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingApr) {
        this.logger.warn(
          `Tentativa de atualizar modelo APR inexistente: ${id}`
        );
        throw new NotFoundException(`Modelo APR com ID ${id} não encontrado`);
      }

      // Se nome foi fornecido, verificar duplicatas
      if (nome && nome.trim() !== existingApr.nome) {
        const duplicateApr = await this.db.getPrisma().apr.findFirst({
          where: {
            nome: nome.trim(),
            deletedAt: null,
            NOT: { id },
          },
        });

        if (duplicateApr) {
          this.logger.warn(
            `Tentativa de atualizar modelo APR com nome duplicado: ${nome}`
          );
          throw new ConflictException(
            `Já existe um modelo APR com o nome "${nome}"`
          );
        }
      }

      // Preparar dados de atualização
      const updateData: any = {
        updatedAt: new Date(),
        updatedBy: 'system', // TODO: Implementar autenticação para obter usuário real
      };

      if (nome) {
        updateData.nome = nome.trim();
      }

      // Atualizar modelo APR
      const apr = await this.db.getPrisma().apr.update({
        where: { id },
        data: updateData,
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

      this.logger.log(`Modelo APR ${id} atualizado com sucesso`);
      return apr as AprResponseDto;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao atualizar modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao atualizar modelo APR');
    }
  }

  /**
   * Remove modelo de APR (soft delete)
   *
   * Remove logicamente um modelo de APR do sistema,
   * preservando os dados para auditoria e histórico.
   *
   * @param id - ID do modelo APR a ser removido
   * @returns void
   *
   * @throws {NotFoundException} Se o modelo não for encontrado
   * @throws {BadRequestException} Se o ID for inválido
   *
   * @example
   * ```typescript
   * await aprService.remove(1);
   * console.log('Modelo APR removido com sucesso');
   * ```
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`Removendo modelo APR: ${id}`);

    // Validar ID
    if (!id || id <= 0) {
      throw new BadRequestException(
        'ID do modelo APR deve ser um número positivo'
      );
    }

    try {
      // Verificar se o modelo existe e está ativo
      const existingApr = await this.db.getPrisma().apr.findFirst({
        where: { id, deletedAt: null },
      });

      if (!existingApr) {
        this.logger.warn(`Tentativa de remover modelo APR inexistente: ${id}`);
        throw new NotFoundException(`Modelo APR com ID ${id} não encontrado`);
      }

      // Realizar soft delete
      await this.db.getPrisma().apr.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedBy: 'system', // TODO: Implementar autenticação para obter usuário real
        },
      });

      this.logger.log(`Modelo APR ${id} removido com sucesso (soft delete)`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao remover modelo APR ${id}:`, error);
      throw new BadRequestException('Erro ao remover modelo APR');
    }
  }

  /**
   * Conta total de modelos APR ativos
   *
   * Retorna o número total de modelos APR ativos no sistema.
   *
   * @returns Número total de modelos ativos
   *
   * @example
   * ```typescript
   * const total = await aprService.count();
   * console.log(`Total de modelos APR: ${total}`);
   * ```
   */
  async count(): Promise<number> {
    this.logger.log('Contando modelos APR ativos');

    try {
      const count = await this.db.getPrisma().apr.count({
        where: { deletedAt: null },
      });

      this.logger.log(`Total de modelos APR ativos: ${count}`);
      return count;
    } catch (error) {
      this.logger.error('Erro ao contar modelos APR:', error);
      throw new BadRequestException('Erro ao contar modelos APR');
    }
  }
}
