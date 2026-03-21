import { Prisma, ProjMotivoOcorrencia, ProjTipoMotivoOcorrencia } from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface ProjMotivoOcorrenciaFilter extends PaginationParams {
  tipo?: ProjTipoMotivoOcorrencia;
  ativo?: boolean;
}

export class ProjMotivoOcorrenciaRepository extends AbstractCrudRepository<
  ProjMotivoOcorrencia,
  ProjMotivoOcorrenciaFilter
> {
  create(
    data: Prisma.ProjMotivoOcorrenciaCreateInput,
    userId?: string
  ): Promise<ProjMotivoOcorrencia> {
    return prisma.projMotivoOcorrencia.create({
      data: {
        ...data,
        createdBy: userId ?? '',
        createdAt: new Date(),
      },
    });
  }

  update(
    id: number,
    data: Prisma.ProjMotivoOcorrenciaUpdateInput,
    userId?: string
  ): Promise<ProjMotivoOcorrencia> {
    return prisma.projMotivoOcorrencia.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId ?? '',
        updatedAt: new Date(),
      },
    });
  }

  delete(id: number, userId: string): Promise<ProjMotivoOcorrencia> {
    return prisma.projMotivoOcorrencia.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: userId,
      },
    });
  }

  findById(id: number): Promise<ProjMotivoOcorrencia | null> {
    return prisma.projMotivoOcorrencia.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields(): string[] {
    return ['codigo', 'descricao'];
  }

  protected buildCustomFilters(
    params: ProjMotivoOcorrenciaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    if (params.tipo) {
      where.tipo = params.tipo;
    }

    if (typeof params.ativo === 'boolean') {
      where.ativo = params.ativo;
    }

    return where;
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<ProjMotivoOcorrencia[]> {
    return prisma.projMotivoOcorrencia.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include ?? this.getDefaultInclude(),
    });
  }

  protected count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.projMotivoOcorrencia.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return undefined;
  }
}
