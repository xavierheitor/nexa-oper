import { Prisma, ChecklistPendencia } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import { QueryBuilder } from '../../db/helpers/queryBuilder';
import { PaginationParams } from '../../types/common';

interface ChecklistPendenciaFilter extends PaginationParams {
  status?: 'AGUARDANDO_TRATAMENTO' | 'EM_TRATAMENTO' | 'TRATADA' | 'REGISTRO_INCORRETO';
  turnoId?: number;
  checklistPreenchidoId?: number;
}

export class ChecklistPendenciaRepository extends AbstractCrudRepository<
  ChecklistPendencia,
  ChecklistPendenciaFilter
> {
  async create(data: unknown): Promise<ChecklistPendencia> {
    throw new Error('ChecklistPendencia não pode ser criada diretamente. Use o serviço de checklist preenchido.');
  }

  async update(
    id: number,
    data: Partial<{
      status: 'AGUARDANDO_TRATAMENTO' | 'EM_TRATAMENTO' | 'TRATADA' | 'REGISTRO_INCORRETO';
      observacaoTratamento?: string;
      tratadoPor?: string;
      tratadoEm?: Date;
    }>,
    userId?: string
  ): Promise<ChecklistPendencia> {
    return prisma.checklistPendencia.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: userId || '',
      },
    });
  }

  async delete(id: number | string, userId: string): Promise<ChecklistPendencia> {
    return prisma.checklistPendencia.update({
      where: { id: Number(id) },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  async findById(id: number | string): Promise<ChecklistPendencia | null> {
    const item = await prisma.checklistPendencia.findUnique({
      where: { id: Number(id), deletedAt: null },
      include: {
        checklistResposta: {
          include: {
            pergunta: true,
            opcaoResposta: true,
          },
        },
        checklistPreenchido: {
          include: {
            checklist: true,
            eletricista: true,
            turno: {
              include: {
                equipe: true,
              },
            },
          },
        },
        turno: {
          include: {
            equipe: true,
          },
        },
        ChecklistRespostaFoto: {
          where: { deletedAt: null },
        },
      },
    });

    if (!item) return null;

    // Converter BigInt para Number para evitar erros de serialização
    return {
      ...item,
      ChecklistRespostaFoto: item.ChecklistRespostaFoto?.map((foto: any) => ({
        ...foto,
        tamanhoBytes: foto.tamanhoBytes ? Number(foto.tamanhoBytes) : null,
      })) || [],
    } as ChecklistPendencia;
  }

  protected getSearchFields(): string[] {
    return ['observacaoProblema', 'observacaoTratamento'];
  }

  protected async findMany(
    where: Prisma.ChecklistPendenciaWhereInput,
    orderBy: Prisma.ChecklistPendenciaOrderByWithRelationInput,
    skip: number,
    take: number,
    include?: any
  ): Promise<ChecklistPendencia[]> {
    const defaultInclude = {
      checklistResposta: {
        include: {
          pergunta: true,
          opcaoResposta: true,
        },
      },
      checklistPreenchido: {
        include: {
          checklist: true,
          eletricista: true,
          turno: {
            include: {
              equipe: true,
            },
          },
        },
      },
      turno: {
        include: {
          equipe: true,
        },
      },
      ChecklistRespostaFoto: {
        where: { deletedAt: null },
      },
    };

    const items = await prisma.checklistPendencia.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || defaultInclude,
    });

    // Converter BigInt para Number para evitar erros de serialização
    return items.map((item: any) => ({
      ...item,
      ChecklistRespostaFoto: item.ChecklistRespostaFoto?.map((foto: any) => ({
        ...foto,
        tamanhoBytes: foto.tamanhoBytes ? Number(foto.tamanhoBytes) : null,
      })) || [],
    }));
  }

  protected count(where: Prisma.ChecklistPendenciaWhereInput): Promise<number> {
    return prisma.checklistPendencia.count({ where });
  }

  async list(params: ChecklistPendenciaFilter): Promise<{ items: ChecklistPendencia[]; total: number }> {
    // Constrói where base com filtros customizados
    const baseWhere: Prisma.ChecklistPendenciaWhereInput = {
      deletedAt: null,
    };

    if (params.status) {
      baseWhere.status = params.status;
    }

    if (params.turnoId) {
      baseWhere.turnoId = params.turnoId;
    }

    if (params.checklistPreenchidoId) {
      baseWhere.checklistPreenchidoId = params.checklistPreenchidoId;
    }

    // Usa QueryBuilder para adicionar busca e paginação
    const queryParams = QueryBuilder.buildQueryParams(
      params,
      this.getSearchFields(),
      baseWhere
    );

    const include = (params as PaginationParams & { include?: any }).include;

    const defaultInclude = {
      checklistResposta: {
        include: {
          pergunta: true,
          opcaoResposta: true,
        },
      },
      checklistPreenchido: {
        include: {
          checklist: true,
          eletricista: true,
          turno: {
            include: {
              equipe: true,
            },
          },
        },
      },
      turno: {
        include: {
          equipe: true,
        },
      },
      ChecklistRespostaFoto: {
        where: { deletedAt: null },
      },
    };

    const [total, itemsRaw] = await Promise.all([
      this.count(queryParams.where),
      this.findMany(
        queryParams.where,
        queryParams.orderBy,
        queryParams.skip,
        queryParams.take,
        include || defaultInclude
      ),
    ]);

    // Converter BigInt para Number para evitar erros de serialização
    const items = itemsRaw.map((item: any) => ({
      ...item,
      ChecklistRespostaFoto: item.ChecklistRespostaFoto?.map((foto: any) => ({
        ...foto,
        tamanhoBytes: foto.tamanhoBytes ? Number(foto.tamanhoBytes) : null,
      })) || [],
    }));

    return { items, total };
  }
}


