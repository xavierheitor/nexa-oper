/**
 * Repositório para Justificativas Individuais (Eletricista)
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Justificativa, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Filtros por eletricista, equipe, data e status
 * - Criação customizada que vincula justificativa à falta
 * - Atualização de status que afeta faltas relacionadas
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new JustificativaRepository();
 * const justificativas = await repository.list({ page: 1, pageSize: 10 });
 * const justificativa = await repository.findById(1);
 * ```
 */

import { Justificativa, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface JustificativaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: 'pendente' | 'aprovada' | 'rejeitada';
}

interface CreateJustificativaData {
  faltaId: number;
  tipoJustificativaId: number;
  descricao?: string;
  createdBy: string;
}

export class JustificativaRepository extends AbstractCrudRepository<
  Justificativa,
  JustificativaFilter
> {
  /**
   * Cria uma nova justificativa individual e vincula à falta
   *
   * Este método é customizado porque cria a justificativa e
   * automaticamente a vincula à falta especificada.
   *
   * @param data - Dados da justificativa (pode ser CreateJustificativaData ou Prisma.HoraExtraCreateInput)
   * @returns Justificativa criada
   */
  async create(data: CreateJustificativaData | Prisma.JustificativaCreateInput): Promise<Justificativa> {
    // Se for CreateJustificativaData, usar lógica customizada
    if ('faltaId' in data && 'tipoJustificativaId' in data) {
      return this.createWithFalta(data as CreateJustificativaData);
    }

    // Caso contrário, criar normalmente
    return prisma.justificativa.create({
      data: {
        ...(data as Prisma.JustificativaCreateInput),
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Cria uma nova justificativa e vincula à falta (método privado)
   *
   * @param data - Dados da justificativa com faltaId
   * @returns Justificativa criada
   */
  private async createWithFalta(data: CreateJustificativaData): Promise<Justificativa> {
    return prisma.$transaction(async (tx) => {
      const justificativa = await tx.justificativa.create({
        data: {
          tipoId: data.tipoJustificativaId,
          descricao: data.descricao || null,
          status: 'pendente',
          createdBy: data.createdBy,
          createdAt: new Date(),
        },
        include: {
          tipo: {
            select: {
              id: true,
              nome: true,
              descricao: true,
              geraFalta: true,
            },
          },
        },
      });

      // Vincular justificativa à falta
      await tx.faltaJustificativa.create({
        data: {
          faltaId: data.faltaId,
          justificativaId: justificativa.id,
          linkedAt: new Date(),
        },
      });

      return justificativa;
    });
  }

  /**
   * Atualiza uma justificativa existente
   *
   * @param id - ID da justificativa
   * @param data - Dados para atualização
   * @returns Justificativa atualizada
   */
  async update(id: number | string, data: Prisma.JustificativaUpdateInput): Promise<Justificativa> {
    return prisma.justificativa.update({
      where: { id: Number(id) },
      data,
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Exclui uma justificativa (hard delete)
   *
   * NOTA: Justificativas são registros históricos e normalmente não devem ser deletadas.
   * Este método existe apenas para completar a interface do repositório.
   *
   * @param id - ID da justificativa
   * @param userId - ID do usuário que está excluindo (não usado, mas requerido pela interface)
   * @returns Justificativa excluída
   */
  async delete(id: number | string, _userId: string): Promise<Justificativa> {
    return prisma.justificativa.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Busca uma justificativa por ID
   *
   * @param id - ID da justificativa
   * @returns Justificativa encontrada ou null
   */
  async findById(id: number | string): Promise<Justificativa | null> {
    return prisma.justificativa.findUnique({
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
  ): Promise<Justificativa[]> {
    return prisma.justificativa.findMany({
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
    return prisma.justificativa.count({ where });
  }

  /**
   * Constrói filtros customizados a partir dos parâmetros
   *
   * Implementa filtros específicos de Justificativa: status, eletricistaId, equipeId, dataInicio, dataFim
   *
   * @param params - Parâmetros de filtro
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   */
  protected buildCustomFilters(
    params: JustificativaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where: Prisma.JustificativaWhereInput = {
      ...(baseWhere as Prisma.JustificativaWhereInput),
    };

    // Filtro por status
    if (params.status) {
      where.status = params.status;
    }

    // Filtros por falta relacionada
    if (params.eletricistaId || params.equipeId || params.dataInicio || params.dataFim) {
      where.Faltas = {
        some: {
          falta: {
            ...(params.eletricistaId && { eletricistaId: params.eletricistaId }),
            ...(params.equipeId && { equipeId: params.equipeId }),
            ...(params.dataInicio || params.dataFim ? {
              dataReferencia: {
                ...(params.dataInicio && { gte: params.dataInicio }),
                ...(params.dataFim && { lte: params.dataFim }),
              },
            } : {}),
          },
        },
      };
    }

    return where;
  }

  /**
   * Atualiza o status de uma justificativa
   *
   * Este método customizado também atualiza o status das faltas vinculadas
   *
   * @param id - ID da justificativa
   * @param status - Novo status ('aprovada' | 'rejeitada')
   * @param decidedBy - ID do usuário que está decidindo
   * @returns Justificativa atualizada
   */
  async updateStatus(id: number, status: 'aprovada' | 'rejeitada', decidedBy: string): Promise<Justificativa> {
    return prisma.$transaction(async (tx) => {
      const justificativa = await tx.justificativa.update({
        where: { id },
        data: {
          status,
          decidedBy,
          decidedAt: new Date(),
        },
        include: {
          tipo: true,
        },
      });

      // Atualizar status das faltas vinculadas
      const faltaStatus = status === 'aprovada' ? 'justificada' : 'indeferida';
      await tx.falta.updateMany({
        where: {
          Justificativas: {
            some: {
              justificativaId: id,
            },
          },
        },
        data: {
          status: faltaStatus,
        },
      });

      return justificativa;
    });
  }

  /**
   * Busca justificativas por falta
   *
   * @param faltaId - ID da falta
   * @returns Array de justificativas vinculadas à falta
   */
  async findByFaltaId(faltaId: number): Promise<Justificativa[]> {
    const vinculos = await prisma.faltaJustificativa.findMany({
      where: { faltaId },
      include: {
        justificativa: {
          include: {
            tipo: {
              select: {
                id: true,
                nome: true,
                descricao: true,
                geraFalta: true,
              },
            },
            Anexos: true,
          },
        },
      },
      orderBy: { linkedAt: 'desc' },
    });

    return vinculos.map((v) => v.justificativa);
  }

  /**
   * Retorna o include padrão para consultas
   *
   * @returns Objeto de include padrão
   */
  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      tipo: {
        select: {
          id: true,
          nome: true,
          descricao: true,
          geraFalta: true,
        },
      },
      Anexos: true,
      Faltas: {
        include: {
          falta: {
            include: {
              eletricista: {
                select: {
                  id: true,
                  nome: true,
                  matricula: true,
                },
              },
              equipe: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
        },
      },
    };
  }

}
