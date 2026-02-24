import { AtividadeFormPergunta, Prisma } from '@nexa-oper/db';
import { ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX } from '../../constants/atividadeForm';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface AtividadeFormPerguntaFilter extends PaginationParams {
  contratoId?: number;
  obrigaFoto?: boolean;
}

export class AtividadeFormPerguntaRepository extends AbstractCrudRepository<
  AtividadeFormPergunta,
  AtividadeFormPerguntaFilter
> {
  create(
    data: Prisma.AtividadeFormPerguntaCreateInput,
    userId?: string
  ): Promise<AtividadeFormPergunta> {
    return prisma.atividadeFormPergunta.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.AtividadeFormPerguntaUpdateInput,
    userId?: string
  ): Promise<AtividadeFormPergunta> {
    return prisma.atividadeFormPergunta.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<AtividadeFormPergunta> {
    return prisma.atividadeFormPergunta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<AtividadeFormPergunta | null> {
    return prisma.atividadeFormPergunta.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields(): string[] {
    return ['titulo', 'perguntaChave', 'hintResposta'];
  }

  protected buildCustomFilters(
    params: AtividadeFormPerguntaFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere };

    where.atividadeFormTemplate = {
      is: {
        nome: { startsWith: ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX },
        ...(params.contratoId ? { contratoId: params.contratoId } : {}),
      },
    };

    if (typeof params.obrigaFoto === 'boolean') {
      where.obrigaFoto = params.obrigaFoto;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<AtividadeFormPergunta[]> {
    return prisma.atividadeFormPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.atividadeFormPergunta.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      atividadeFormTemplate: {
        include: {
          contrato: true,
        },
      },
    };
  }
}
