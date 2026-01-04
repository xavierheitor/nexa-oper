/**
 * Repositório para Justificativas de Equipe
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade JustificativaEquipe, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Filtros por equipe, data e status
 * - Atualização de status
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new JustificativaEquipeRepository();
 * const justificativas = await repository.list({ page: 1, pageSize: 10 });
 * const justificativa = await repository.findById(1);
 * ```
 */

import { JustificativaEquipe, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface JustificativaEquipeFilter extends PaginationParams {
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
}

interface CreateJustificativaEquipeData {
  equipeId: number;
  dataReferencia: Date;
  tipoJustificativaId: number;
  descricao?: string;
  createdBy: string;
}

export class JustificativaEquipeRepository extends AbstractCrudRepository<
  JustificativaEquipe,
  JustificativaEquipeFilter
> {
  /**
   * Cria uma nova justificativa de equipe
   *
   * @param data - Dados da justificativa (pode ser CreateJustificativaEquipeData ou Prisma.JustificativaEquipeCreateInput)
   * @returns Justificativa de equipe criada
   */
  async create(data: CreateJustificativaEquipeData | Prisma.JustificativaEquipeCreateInput): Promise<JustificativaEquipe> {
    // Se for CreateJustificativaEquipeData, usar lógica customizada
    if ('equipeId' in data && 'dataReferencia' in data && 'tipoJustificativaId' in data && 'createdBy' in data) {
      return this.createCustom(data as CreateJustificativaEquipeData);
    }

    // Caso contrário, criar normalmente
    return prisma.justificativaEquipe.create({
      data: {
        ...(data as Prisma.JustificativaEquipeCreateInput),
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Cria uma nova justificativa de equipe (método privado)
   *
   * @param data - Dados da justificativa
   * @returns Justificativa de equipe criada
   */
  private async createCustom(data: CreateJustificativaEquipeData): Promise<JustificativaEquipe> {
    return prisma.justificativaEquipe.create({
      data: {
        equipeId: data.equipeId,
        dataReferencia: data.dataReferencia,
        tipoJustificativaId: data.tipoJustificativaId,
        descricao: data.descricao || null,
        status: 'pendente',
        createdBy: data.createdBy,
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Atualiza uma justificativa de equipe existente
   *
   * @param id - ID da justificativa
   * @param data - Dados para atualização
   * @returns Justificativa de equipe atualizada
   */
  async update(id: number | string, data: Prisma.JustificativaEquipeUpdateInput): Promise<JustificativaEquipe> {
    return prisma.justificativaEquipe.update({
      where: { id: Number(id) },
      data,
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Exclui uma justificativa de equipe (hard delete)
   *
   * NOTA: Justificativas de equipe são registros históricos e normalmente não devem ser deletadas.
   * Este método existe apenas para completar a interface do repositório.
   *
   * @param id - ID da justificativa
   * @param userId - ID do usuário que está excluindo (não usado, mas requerido pela interface)
   * @returns Justificativa de equipe excluída
   */
  async delete(id: number | string, userId: string): Promise<JustificativaEquipe> {
    return prisma.justificativaEquipe.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Busca uma justificativa de equipe por ID
   *
   * @param id - ID da justificativa
   * @returns Justificativa de equipe encontrada ou null
   */
  async findById(id: number | string): Promise<JustificativaEquipe | null> {
    return prisma.justificativaEquipe.findUnique({
      where: { id: Number(id) },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Define quais campos podem ser utilizados para busca
   *
   * @returns Array com os nomes dos campos de busca
   */
  protected getSearchFields(): string[] {
    return ['descricao'];
  }

  /**
   * Executa a consulta findMany no ORM
   *
   * @param where - Condições de filtro
   * @param orderBy - Ordenação
   * @param skip - Registros a pular
   * @param take - Registros a retornar
   * @param include - Relacionamentos a incluir (opcional)
   * @returns Array de registros
   */
  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<JustificativaEquipe[]> {
    return prisma.justificativaEquipe.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  /**
   * Executa a consulta count no ORM
   *
   * @param where - Condições de filtro
   * @returns Número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.justificativaEquipe.count({ where });
  }

  /**
   * Lista justificativas de equipe com filtros e paginação
   *
   * Sobrescreve o método base para adicionar suporte a filtros customizados
   */
  async list(params: JustificativaEquipeFilter): Promise<{ items: JustificativaEquipe[]; total: number }> {
    const {
      page = 1,
      pageSize = 20,
      orderBy = 'dataReferencia',
      orderDir = 'desc',
      search,
      equipeId,
      dataInicio,
      dataFim,
      status,
      include,
    } = params;

    const skip = (page - 1) * pageSize;

    // Construir where com filtros customizados
    const where: any = {};

    if (equipeId) {
      where.equipeId = equipeId;
    }

    if (dataInicio || dataFim) {
      where.dataReferencia = {};
      if (dataInicio) {
        where.dataReferencia.gte = dataInicio;
      }
      if (dataFim) {
        where.dataReferencia.lte = dataFim;
      }
    }

    if (status) {
      where.status = status;
    }

    // Adicionar busca por texto se fornecido
    if (search) {
      const searchWhere = this.buildSearchWhere(search);
      where.AND = where.AND ? [...where.AND, searchWhere] : [searchWhere];
    }

    const [items, total] = await Promise.all([
      prisma.justificativaEquipe.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [orderBy]: orderDir },
        include: include || this.getDefaultInclude(),
      }),
      prisma.justificativaEquipe.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Atualiza o status de uma justificativa de equipe
   *
   * @param id - ID da justificativa
   * @param status - Novo status ('aprovada' | 'rejeitada')
   * @param decidedBy - ID do usuário que está decidindo
   * @returns Justificativa de equipe atualizada
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', decidedBy: string): Promise<JustificativaEquipe> {
    return prisma.justificativaEquipe.update({
      where: { id },
      data: {
        status,
        decidedBy,
        decidedAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Verifica se já existe justificativa para equipe e data
   *
   * @param equipeId - ID da equipe
   * @param dataReferencia - Data de referência
   * @returns Justificativa encontrada ou null
   */
  async findByEquipeAndData(equipeId: number, dataReferencia: Date): Promise<JustificativaEquipe | null> {
    return prisma.justificativaEquipe.findUnique({
      where: {
        dataReferencia_equipeId: {
          dataReferencia,
          equipeId,
        },
      },
    });
  }

  /**
   * Retorna o include padrão para consultas
   *
   * @returns Objeto de include padrão
   */
  private getDefaultInclude() {
    return {
      equipe: {
        select: {
          id: true,
          nome: true,
        },
      },
      tipoJustificativa: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          geraFalta: true,
        },
      },
      Anexos: true,
    };
  }

  /**
   * Constrói where para busca por texto
   *
   * @param search - Termo de busca
   * @returns Objeto where para busca
   */
  private buildSearchWhere(search: string) {
    const searchFields = this.getSearchFields();
    return {
      OR: searchFields.map(field => ({
        [field]: { contains: search },
      })),
    };
  }
}
