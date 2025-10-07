/**
 * Repositório de Escalas
 *
 * Este repositório centraliza todo o acesso aos dados relacionados às
 * escalas de trabalho. Além das operações CRUD padrão, ele disponibiliza
 * utilitários específicos para substituição de horários, gerenciamento
 * das alocações de eletricistas e consultas com diferentes níveis de
 * detalhamento.
 *
 * PRINCIPAIS RESPONSABILIDADES:
 * - Criar, atualizar e recuperar escalas com seus relacionamentos
 * - Aplicar filtros avançados (contrato, status, busca textual)
 * - Substituir horários do ciclo preservando auditoria
 * - Gerenciar as alocações (EscalaAlocacao) por horário
 * - Fornecer consultas otimizadas para geração de agenda
 */

import {
  Contrato,
  Eletricista,
  Escala,
  EscalaAlocacao,
  EscalaHorario,
  Prisma,
} from '@nexa-oper/db';
import { AbstractCrudRepository } from '../abstracts/AbstractCrudRepository';
import { prisma } from '../db/db.service';
import type { EscalaFilter, EscalaHorarioInput } from '../schemas/escalaSchema';

/**
 * Tipo auxiliar que expõe a escala com todos os relacionamentos necessários
 * para a camada de apresentação (contrato, horários e alocações).
 */
export type EscalaWithRelations = Escala & {
  contrato: Contrato;
  horarios: Array<
    EscalaHorario & {
      alocacoes: Array<
        EscalaAlocacao & {
          eletricista: Pick<Eletricista, 'id' | 'nome' | 'matricula'>;
        }
      >;
    }
  >;
};

/**
 * Tipo com filtros suportados pelo repositório.
 */
export interface EscalaRepositoryFilter extends PaginationParams {
  contratoId?: number;
  ativo?: boolean;
}

/**
 * Include padrão utilizado nas consultas detalhadas.
 */
const detailedInclude = {
  contrato: true,
  horarios: {
    where: { deletedAt: null },
    include: {
      alocacoes: {
        where: { deletedAt: null },
        include: {
          eletricista: {
            select: { id: true, nome: true, matricula: true },
          },
        },
      },
    },
  },
} satisfies Prisma.EscalaInclude;

/**
 * Include enxuto utilizado em listagens para economizar dados.
 */
const listInclude = {
  contrato: true,
} satisfies Prisma.EscalaInclude;

export class EscalaRepository extends AbstractCrudRepository<
  EscalaWithRelations,
  EscalaRepositoryFilter
> {
  /**
   * Cria uma nova escala com horários relacionados.
   */
  async create(data: Prisma.EscalaCreateInput): Promise<EscalaWithRelations> {
    return prisma.escala.create({
      data,
      include: detailedInclude,
    }) as Promise<EscalaWithRelations>;
  }

  /**
   * Atualiza campos da escala. A substituição dos horários é tratada em
   * um método dedicado para manter a transação explícita.
   */
  update(id: number, data: Prisma.EscalaUpdateInput): Promise<EscalaWithRelations> {
    return prisma.escala.update({
      where: { id },
      data,
      include: detailedInclude,
    }) as Promise<EscalaWithRelations>;
  }

  /**
   * Soft delete da escala aplicando campos de auditoria.
   */
  delete(id: number, userId: string): Promise<EscalaWithRelations> {
    return prisma.escala.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
        ativo: false,
      },
      include: detailedInclude,
    }) as Promise<EscalaWithRelations>;
  }

  /**
   * Busca escala por ID com todos os relacionamentos relevantes.
   */
  findById(id: number): Promise<EscalaWithRelations | null> {
    return prisma.escala.findFirst({
      where: { id, deletedAt: null },
      include: detailedInclude,
    }) as Promise<EscalaWithRelations | null>;
  }

  /**
   * Define campos que participam da busca textual.
   */
  protected getSearchFields(): string[] {
    return ['nome', 'codigo'];
  }

  /**
   * Implementação base para listagem paginada. Utilizamos o include enxuto,
   * pois a tabela mostra apenas informações resumidas.
   */
  protected findMany(
    where: Prisma.EscalaWhereInput,
    orderBy: Prisma.Enumerable<Prisma.EscalaOrderByWithRelationInput>,
    skip: number,
    take: number,
    include?: Prisma.EscalaInclude
  ): Promise<EscalaWithRelations[]> {
    return prisma.escala.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? listInclude,
    }) as Promise<EscalaWithRelations[]>;
  }

  /**
   * Conta registros respeitando o filtro informado.
   */
  protected count(where: Prisma.EscalaWhereInput): Promise<number> {
    return prisma.escala.count({ where });
  }

  /**
   * Listagem com filtros adicionais (contrato e status). Essa função é
   * utilizada pela camada de serviço para aplicar regras customizadas que o
   * QueryBuilder padrão não contempla.
   */
  async listWithFilters(
    params: EscalaFilter
  ): Promise<{ items: EscalaWithRelations[]; total: number }> {
    const where: Prisma.EscalaWhereInput = {
      deletedAt: null,
    };

    if (params.search?.trim()) {
      const term = params.search.trim();
      where.OR = [
        { nome: { contains: term, mode: 'insensitive' } },
        { codigo: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (typeof params.ativo === 'boolean') {
      where.ativo = params.ativo;
    }

    if (typeof params.contratoId === 'number') {
      where.contratoId = params.contratoId;
    }

    const orderBy: Prisma.EscalaOrderByWithRelationInput = {
      [params.orderBy]: params.orderDir,
    } as Prisma.EscalaOrderByWithRelationInput;

    const [items, total] = await prisma.$transaction([
      prisma.escala.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: (params.include as Prisma.EscalaInclude) ?? listInclude,
      }),
      prisma.escala.count({ where }),
    ]);

    return {
      items: items as EscalaWithRelations[],
      total,
    };
  }

  /**
   * Remove todos os horários existentes e recria com base na lista recebida.
   * Utilizado em atualizações para simplificar a manutenção do ciclo.
   */
  async replaceHorarios(
    escalaId: number,
    horarios: EscalaHorarioInput[],
    userId: string
  ): Promise<void> {
    await prisma.$transaction(async tx => {
      await tx.escalaHorario.deleteMany({ where: { escalaId } });

      if (!horarios.length) {
        return;
      }

      for (const horario of horarios) {
        await tx.escalaHorario.create({
          data: {
            escalaId,
            indiceCiclo: horario.indiceCiclo,
            diaSemana: horario.diaSemana ?? null,
            horaInicio: horario.horaInicio ?? null,
            horaFim: horario.horaFim ?? null,
            eletricistasNecessarios: horario.eletricistasNecessarios,
            folga: horario.folga ?? false,
            etiqueta: horario.etiqueta ?? null,
            rotacaoOffset: horario.rotacaoOffset ?? 0,
            createdBy: userId,
            createdAt: new Date(),
          },
        });
      }
    });
  }

  /**
   * Substitui todas as alocações de um conjunto de horários.
   */
  async replaceAllocations(
    escalaId: number,
    items: Array<{
      horarioId: number;
      eletricistaId: number;
      ordemRotacao?: number;
      vigenciaInicio?: Date | null;
      vigenciaFim?: Date | null;
      ativo?: boolean;
    }>,
    userId: string
  ): Promise<void> {
    if (!items.length) {
      return;
    }

    const grouped = new Map<number, typeof items>();
    for (const allocation of items) {
      const list = grouped.get(allocation.horarioId) ?? [];
      list.push(allocation);
      grouped.set(allocation.horarioId, list);
    }

    await prisma.$transaction(async tx => {
      for (const [horarioId, allocations] of grouped.entries()) {
        const horario = await tx.escalaHorario.findFirst({
          where: { id: horarioId, escalaId, deletedAt: null },
        });

        if (!horario) {
          throw new Error('Horário informado não pertence à escala.');
        }

        await tx.escalaAlocacao.deleteMany({ where: { escalaHorarioId: horarioId } });

        if (!allocations.length) {
          continue;
        }

        await tx.escalaAlocacao.createMany({
          data: allocations.map(allocation => ({
            escalaHorarioId: horarioId,
            eletricistaId: allocation.eletricistaId,
            ordemRotacao: allocation.ordemRotacao ?? 0,
            vigenciaInicio: allocation.vigenciaInicio ?? null,
            vigenciaFim: allocation.vigenciaFim ?? null,
            ativo: allocation.ativo ?? true,
            createdAt: new Date(),
            createdBy: userId,
          })),
        });
      }
    });
  }

  /**
   * Consulta versão simplificada da escala, sem horários, utilizada em selects.
   */
  async findBasicById(id: number): Promise<Escala | null> {
    return prisma.escala.findFirst({
      where: { id, deletedAt: null },
    });
  }
}
