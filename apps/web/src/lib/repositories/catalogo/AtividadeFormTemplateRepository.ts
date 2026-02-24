import { AtividadeFormTemplate, Prisma } from '@nexa-oper/db';
import {
  ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX,
  getAtividadeCatalogTemplateName,
} from '../../constants/atividadeForm';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface AtividadeFormTemplateFilter extends PaginationParams {
  contratoId?: number;
}

export class AtividadeFormTemplateRepository extends AbstractCrudRepository<
  AtividadeFormTemplate,
  AtividadeFormTemplateFilter
> {
  create(
    data: Prisma.AtividadeFormTemplateCreateInput,
    userId?: string
  ): Promise<AtividadeFormTemplate> {
    return prisma.atividadeFormTemplate.create({
      data: { ...data, createdAt: new Date(), createdBy: userId || '' },
    });
  }

  update(
    id: number,
    data: Prisma.AtividadeFormTemplateUpdateInput,
    userId?: string
  ): Promise<AtividadeFormTemplate> {
    return prisma.atividadeFormTemplate.update({
      where: { id },
      data: { ...data, updatedAt: new Date(), updatedBy: userId || '' },
    });
  }

  delete(id: number, userId: string): Promise<AtividadeFormTemplate> {
    return prisma.atividadeFormTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number): Promise<AtividadeFormTemplate | null> {
    return prisma.atividadeFormTemplate.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields(): string[] {
    return ['nome', 'descricao'];
  }

  protected buildCustomFilters(
    params: AtividadeFormTemplateFilter,
    baseWhere: GenericPrismaWhereInput
  ): GenericPrismaWhereInput {
    const where = { ...baseWhere } as GenericPrismaWhereInput & {
      NOT?: unknown;
    };

    const currentNot = Array.isArray(where.NOT)
      ? where.NOT
      : where.NOT
        ? [where.NOT]
        : [];

    where.NOT = [
      ...currentNot,
      { nome: { startsWith: ATIVIDADE_FORM_CATALOGO_TEMPLATE_PREFIX } },
    ];

    if (params.contratoId) {
      where.contratoId = params.contratoId;
    }

    return where;
  }

  protected async findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ): Promise<AtividadeFormTemplate[]> {
    return prisma.atividadeFormTemplate.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected async count(where: GenericPrismaWhereInput): Promise<number> {
    return prisma.atividadeFormTemplate.count({ where });
  }

  protected getDefaultInclude(): GenericPrismaIncludeInput {
    return {
      contrato: true,
      atividadeFormPerguntas: {
        where: { deletedAt: null },
        select: { id: true, perguntaChave: true },
      },
      atividadeFormTipoServicoRelacoes: {
        where: { deletedAt: null },
        include: {
          atividadeTipoServico: {
            include: { atividadeTipo: true },
          },
        },
      },
    };
  }

  async ensurePerguntaCatalogoTemplate(
    contratoId: number,
    userId: string
  ): Promise<AtividadeFormTemplate> {
    const nome = getAtividadeCatalogTemplateName(contratoId);

    const existing = await prisma.atividadeFormTemplate.findFirst({
      where: {
        contratoId,
        nome,
      },
    });

    if (existing) {
      if (existing.deletedAt) {
        return prisma.atividadeFormTemplate.update({
          where: { id: existing.id },
          data: {
            deletedAt: null,
            deletedBy: null,
            ativo: false,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        });
      }

      return existing;
    }

    return prisma.atividadeFormTemplate.create({
      data: {
        nome,
        descricao: 'Template técnico para catálogo de perguntas reutilizáveis.',
        ativo: false,
        contrato: { connect: { id: contratoId } },
        createdAt: new Date(),
        createdBy: userId,
      },
    });
  }

  async setTipoServicos(
    atividadeFormTemplateId: number,
    atividadeTipoServicoIds: number[],
    userId: string
  ): Promise<void> {
    const existing = await prisma.atividadeFormTipoServicoRelacao.findMany({
      where: { atividadeFormTemplateId },
      select: { id: true, atividadeTipoServicoId: true, deletedAt: true, ativo: true },
    });

    const targetIds = new Set(atividadeTipoServicoIds);
    const existingMap = new Map(existing.map((item) => [item.atividadeTipoServicoId, item]));

    const toSoftDelete = existing.filter(
      (item) => item.deletedAt === null && !targetIds.has(item.atividadeTipoServicoId)
    );

    const toRestore = existing.filter(
      (item) => item.deletedAt !== null && targetIds.has(item.atividadeTipoServicoId)
    );

    const toActivate = existing.filter(
      (item) => item.deletedAt === null &&
        targetIds.has(item.atividadeTipoServicoId) &&
        !item.ativo
    );

    const toCreate = atividadeTipoServicoIds.filter(
      (atividadeTipoServicoId) => !existingMap.has(atividadeTipoServicoId)
    );

    await Promise.all([
      ...toSoftDelete.map((item) =>
        prisma.atividadeFormTipoServicoRelacao.update({
          where: { id: item.id },
          data: {
            ativo: false,
            deletedAt: new Date(),
            deletedBy: userId,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        })
      ),
      ...toRestore.map((item) =>
        prisma.atividadeFormTipoServicoRelacao.update({
          where: { id: item.id },
          data: {
            ativo: true,
            deletedAt: null,
            deletedBy: null,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        })
      ),
      ...toActivate.map((item) =>
        prisma.atividadeFormTipoServicoRelacao.update({
          where: { id: item.id },
          data: {
            ativo: true,
            updatedAt: new Date(),
            updatedBy: userId,
          },
        })
      ),
      ...toCreate.map((atividadeTipoServicoId) =>
        prisma.atividadeFormTipoServicoRelacao.create({
          data: {
            atividadeFormTemplate: { connect: { id: atividadeFormTemplateId } },
            atividadeTipoServico: { connect: { id: atividadeTipoServicoId } },
            ativo: true,
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      ),
    ]);
  }

  async setPerguntasFromCatalogo(
    atividadeFormTemplateId: number,
    contratoId: number,
    perguntaCatalogoIds: number[],
    userId: string
  ): Promise<void> {
    const catalogTemplate = await this.ensurePerguntaCatalogoTemplate(contratoId, userId);

    const catalogPerguntas = perguntaCatalogoIds.length
      ? await prisma.atividadeFormPergunta.findMany({
          where: {
            id: { in: perguntaCatalogoIds },
            atividadeFormTemplateId: catalogTemplate.id,
            deletedAt: null,
          },
        })
      : [];

    if (catalogPerguntas.length !== perguntaCatalogoIds.length) {
      throw new Error('Uma ou mais perguntas selecionadas não pertencem ao catálogo.');
    }

    const existing = await prisma.atividadeFormPergunta.findMany({
      where: { atividadeFormTemplateId },
      select: { id: true, perguntaChave: true, deletedAt: true },
    });

    const existingByKey = new Map(existing.map((item) => [item.perguntaChave, item]));
    const targetKeys = new Set(catalogPerguntas.map((item) => item.perguntaChave));

    const promises: Promise<unknown>[] = [];

    for (const item of existing) {
      if (item.deletedAt === null && !targetKeys.has(item.perguntaChave)) {
        promises.push(
          prisma.atividadeFormPergunta.update({
            where: { id: item.id },
            data: {
              deletedAt: new Date(),
              deletedBy: userId,
              updatedAt: new Date(),
              updatedBy: userId,
              ativo: false,
            },
          })
        );
      }
    }

    for (const perguntaCatalogo of catalogPerguntas) {
      const existingItem = existingByKey.get(perguntaCatalogo.perguntaChave);

      if (existingItem) {
        promises.push(
          prisma.atividadeFormPergunta.update({
            where: { id: existingItem.id },
            data: {
              perguntaChave: perguntaCatalogo.perguntaChave,
              ordem: perguntaCatalogo.ordem,
              titulo: perguntaCatalogo.titulo,
              hintResposta: perguntaCatalogo.hintResposta,
              tipoResposta: perguntaCatalogo.tipoResposta,
              obrigaFoto: perguntaCatalogo.obrigaFoto,
              ativo: perguntaCatalogo.ativo,
              deletedAt: null,
              deletedBy: null,
              updatedAt: new Date(),
              updatedBy: userId,
            },
          })
        );
        continue;
      }

      promises.push(
        prisma.atividadeFormPergunta.create({
          data: {
            atividadeFormTemplate: { connect: { id: atividadeFormTemplateId } },
            perguntaChave: perguntaCatalogo.perguntaChave,
            ordem: perguntaCatalogo.ordem,
            titulo: perguntaCatalogo.titulo,
            hintResposta: perguntaCatalogo.hintResposta,
            tipoResposta: perguntaCatalogo.tipoResposta,
            obrigaFoto: perguntaCatalogo.obrigaFoto,
            ativo: perguntaCatalogo.ativo,
            createdAt: new Date(),
            createdBy: userId,
          },
        })
      );
    }

    await Promise.all(promises);
  }
}
