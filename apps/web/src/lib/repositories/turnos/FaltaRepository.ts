/**
 * Repositório para Faltas
 *
 * Este repositório implementa operações de acesso a dados
 * para a entidade Falta, utilizando o padrão Repository
 * e estendendo a classe abstrata AbstractCrudRepository.
 *
 * FUNCIONALIDADES:
 * - Operações CRUD completas
 * - Paginação automática
 * - Filtros por eletricista, equipe, data e status
 * - Integração com Prisma ORM
 *
 * COMO USAR:
 * ```typescript
 * const repository = new FaltaRepository();
 * const faltas = await repository.list({ page: 1, pageSize: 10 });
 * const falta = await repository.findById(1);
 * ```
 */

import { Falta, Prisma } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type { GenericPrismaWhereInput, GenericPrismaOrderByInput, GenericPrismaIncludeInput } from '../../types/prisma';

interface FaltaFilter extends PaginationParams {
  eletricistaId?: number;
  equipeId?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status?: string;
}

export class FaltaRepository extends AbstractCrudRepository<
  Falta,
  FaltaFilter
> {
  /**
   * Cria uma nova falta
   *
   * @param data - Dados da falta
   * @returns Falta criada
   */
  async create(data: Prisma.FaltaCreateInput): Promise<Falta> {
    return prisma.falta.create({
      data: {
        ...data,
        createdAt: new Date(),
      },
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Atualiza uma falta existente
   *
   * @param id - ID da falta
   * @param data - Dados para atualização
   * @returns Falta atualizada
   */
  async update(id: number | string, data: Prisma.FaltaUpdateInput): Promise<Falta> {
    return prisma.falta.update({
      where: { id: Number(id) },
      data,
      include: this.getDefaultInclude(),
    });
  }

  /**
   * Exclui uma falta (hard delete)
   *
   * NOTA: Faltas são registros históricos e normalmente não devem ser deletadas.
   * Este método existe apenas para completar a interface do repositório.
   *
   * @param id - ID da falta
   * @param userId - ID do usuário que está excluindo (não usado, mas requerido pela interface)
   * @returns Falta excluída
   */
  async delete(id: number | string, userId: string): Promise<Falta> {
    return prisma.falta.delete({
      where: { id: Number(id) },
    });
  }

  /**
   * Busca uma falta por ID
   *
   * @param id - ID da falta
   * @returns Falta encontrada ou null
   */
  async findById(id: number | string): Promise<Falta | null> {
    return prisma.falta.findUnique({
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
    return ['motivoSistema'];
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
  ): Promise<Falta[]> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c28805d-18e5-4a0d-bd0c-9f591d50615f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FaltaRepository.ts:119',message:'listFaltas findMany ENTRY',data:{where,orderBy,skip,take},timestamp:Date.now(),sessionId:'debug-session',runId:'list',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await prisma.falta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c28805d-18e5-4a0d-bd0c-9f591d50615f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FaltaRepository.ts:133',message:'listFaltas findMany EXIT',data:{count:result.length,ids:result.map(f=>({id:f.id,dataReferencia:f.dataReferencia.toISOString(),equipeId:f.equipeId,eletricistaId:f.eletricistaId,status:f.status}))},timestamp:Date.now(),sessionId:'debug-session',runId:'list',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return result;
  }

  /**
   * Executa a consulta count no ORM
   *
   * @param where - Condições de filtro
   * @returns Número total de registros
   */
  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c28805d-18e5-4a0d-bd0c-9f591d50615f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FaltaRepository.ts:141',message:'listFaltas count ENTRY',data:{where},timestamp:Date.now(),sessionId:'debug-session',runId:'list',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await prisma.falta.count({ where });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7c28805d-18e5-4a0d-bd0c-9f591d50615f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'FaltaRepository.ts:143',message:'listFaltas count EXIT',data:{count:result},timestamp:Date.now(),sessionId:'debug-session',runId:'list',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return result;
  }

  /**
   * Constrói filtros customizados a partir dos parâmetros
   *
   * Implementa filtros específicos de Falta: eletricistaId, equipeId, dataInicio, dataFim, status
   *
   * @param params - Parâmetros de filtro
   * @param baseWhere - Filtros base já construídos (soft delete, busca, etc)
   * @returns Objeto where com filtros customizados aplicados
   */
  protected buildCustomFilters(
    params: FaltaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where: Prisma.FaltaWhereInput = {
      ...(baseWhere as Prisma.FaltaWhereInput),
    };

    // Filtro por eletricista
    if (params.eletricistaId) {
      where.eletricistaId = params.eletricistaId;
    }

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
   * Verifica se o modelo tem soft delete
   *
   * Faltas não têm soft delete no schema
   */
  protected hasSoftDelete(): boolean {
    return false;
  }

  /**
   * Retorna o include padrão para consultas
   *
   * @returns Objeto de include padrão tipado com Prisma.FaltaInclude
   */
  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
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
      escalaSlot: true,
      Justificativas: {
        include: {
          justificativa: {
            include: {
              tipo: true,
            },
          },
        },
      },
    };
  }

}
