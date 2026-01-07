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
   * Verifica se o modelo tem soft delete
   *
   * JustificativaEquipe não tem soft delete (não tem campo deletedAt)
   *
   * @returns false - este modelo não tem soft delete
   */
  protected hasSoftDelete(): boolean {
    return false;
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
   * Constrói filtros customizados a partir dos parâmetros
   *
   * Implementa filtros específicos de JustificativaEquipe: equipeId, dataInicio, dataFim, status
   *
   * @param params - Parâmetros de filtro
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   */
  protected buildCustomFilters(
    params: JustificativaEquipeFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where: Prisma.JustificativaEquipeWhereInput = {
      ...(baseWhere as Prisma.JustificativaEquipeWhereInput),
    };

    // Filtro por equipe
    if (params.equipeId) {
      where.equipeId = params.equipeId;
    }

    // Filtro por range de datas
    if (params.dataInicio || params.dataFim) {
      where.dataReferencia = {};
      if (params.dataInicio) {
        where.dataReferencia.gte = params.dataInicio;
      }
      if (params.dataFim) {
        where.dataReferencia.lte = params.dataFim;
      }
    }

    // Filtro por status
    if (params.status) {
      where.status = params.status;
    }

    return where;
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
  protected getDefaultInclude(): GenericPrismaIncludeInput {
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

}

