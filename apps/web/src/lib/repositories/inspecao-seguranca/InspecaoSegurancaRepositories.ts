import {
  InspecaoSegurancaGrupoPergunta,
  InspecaoSegurancaModelo,
  InspecaoSegurancaOpcaoResposta,
  InspecaoSegurancaPergunta,
  InspecaoSegurancaTipo,
  Prisma,
} from '@nexa-oper/db';
import { AbstractCrudRepository } from '../../abstracts/AbstractCrudRepository';
import { prisma } from '../../db/db.service';
import type { PaginationParams } from '../../types/common';
import type {
  GenericPrismaIncludeInput,
  GenericPrismaOrderByInput,
  GenericPrismaWhereInput,
} from '../../types/prisma';

interface Filter extends PaginationParams {}

export class InspecaoSegurancaTipoRepository extends AbstractCrudRepository<
  InspecaoSegurancaTipo,
  Filter
> {
  create(data: Prisma.InspecaoSegurancaTipoCreateInput) {
    return prisma.inspecaoSegurancaTipo.create({ data });
  }

  update(id: number, data: Prisma.InspecaoSegurancaTipoUpdateInput, userId?: string) {
    return prisma.inspecaoSegurancaTipo.update({
      where: { id },
      data: { ...data, updatedBy: userId || 'system', updatedAt: new Date() },
    });
  }

  delete(id: number, userId: string) {
    return prisma.inspecaoSegurancaTipo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number) {
    return prisma.inspecaoSegurancaTipo.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields() {
    return ['nome', 'chave', 'descricao'];
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ) {
    return prisma.inspecaoSegurancaTipo.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
  }

  protected count(where: GenericPrismaWhereInput) {
    return prisma.inspecaoSegurancaTipo.count({ where });
  }
}

export class InspecaoSegurancaPerguntaRepository extends AbstractCrudRepository<
  InspecaoSegurancaPergunta,
  Filter
> {
  create(data: Prisma.InspecaoSegurancaPerguntaCreateInput) {
    return prisma.inspecaoSegurancaPergunta.create({ data });
  }

  update(id: number, data: Prisma.InspecaoSegurancaPerguntaUpdateInput, userId?: string) {
    return prisma.inspecaoSegurancaPergunta.update({
      where: { id },
      data: { ...data, updatedBy: userId || 'system', updatedAt: new Date() },
    });
  }

  delete(id: number, userId: string) {
    return prisma.inspecaoSegurancaPergunta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number) {
    return prisma.inspecaoSegurancaPergunta.findUnique({ where: { id, deletedAt: null } });
  }

  protected getSearchFields() {
    return ['nome'];
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ) {
    return prisma.inspecaoSegurancaPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
  }

  protected count(where: GenericPrismaWhereInput) {
    return prisma.inspecaoSegurancaPergunta.count({ where });
  }
}

export class InspecaoSegurancaOpcaoRespostaRepository extends AbstractCrudRepository<
  InspecaoSegurancaOpcaoResposta,
  Filter
> {
  create(data: Prisma.InspecaoSegurancaOpcaoRespostaCreateInput) {
    return prisma.inspecaoSegurancaOpcaoResposta.create({ data });
  }

  update(id: number, data: Prisma.InspecaoSegurancaOpcaoRespostaUpdateInput, userId?: string) {
    return prisma.inspecaoSegurancaOpcaoResposta.update({
      where: { id },
      data: { ...data, updatedBy: userId || 'system', updatedAt: new Date() },
    });
  }

  delete(id: number, userId: string) {
    return prisma.inspecaoSegurancaOpcaoResposta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number) {
    return prisma.inspecaoSegurancaOpcaoResposta.findUnique({
      where: { id, deletedAt: null },
    });
  }

  protected getSearchFields() {
    return ['nome'];
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ) {
    return prisma.inspecaoSegurancaOpcaoResposta.findMany({
      where,
      orderBy,
      skip,
      take,
      include,
    });
  }

  protected count(where: GenericPrismaWhereInput) {
    return prisma.inspecaoSegurancaOpcaoResposta.count({ where });
  }
}

export class InspecaoSegurancaGrupoPerguntaRepository extends AbstractCrudRepository<
  InspecaoSegurancaGrupoPergunta,
  Filter
> {
  create(data: Prisma.InspecaoSegurancaGrupoPerguntaCreateInput) {
    return prisma.inspecaoSegurancaGrupoPergunta.create({ data });
  }

  update(id: number, data: Prisma.InspecaoSegurancaGrupoPerguntaUpdateInput, userId?: string) {
    return prisma.inspecaoSegurancaGrupoPergunta.update({
      where: { id },
      data: { ...data, updatedBy: userId || 'system', updatedAt: new Date() },
    });
  }

  delete(id: number, userId: string) {
    return prisma.inspecaoSegurancaGrupoPergunta.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number) {
    return prisma.inspecaoSegurancaGrupoPergunta.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields() {
    return ['nome', 'tipoResposta'];
  }

  protected getDefaultInclude() {
    return {
      perguntasRelacao: {
        where: { deletedAt: null },
        orderBy: { ordem: 'asc' as const },
        include: { pergunta: true },
      },
      opcoesRelacao: {
        where: { deletedAt: null },
        orderBy: { ordem: 'asc' as const },
        include: { opcaoResposta: true },
      },
    };
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ) {
    return prisma.inspecaoSegurancaGrupoPergunta.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected count(where: GenericPrismaWhereInput) {
    return prisma.inspecaoSegurancaGrupoPergunta.count({ where });
  }

  async setPerguntas(grupoPerguntaId: number, perguntaIds: number[], userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.inspecaoSegurancaGrupoPerguntaRelacao.updateMany({
        where: { grupoPerguntaId, deletedAt: null },
        data: { deletedAt: new Date(), deletedBy: userId },
      });
      for (const [ordem, perguntaId] of perguntaIds.entries()) {
        await tx.inspecaoSegurancaGrupoPerguntaRelacao.create({
          data: { grupoPerguntaId, perguntaId, ordem, createdBy: userId },
        });
      }
    });
  }

  async setOpcoes(grupoPerguntaId: number, opcaoRespostaIds: number[], userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.inspecaoSegurancaGrupoOpcaoRespostaRelacao.updateMany({
        where: { grupoPerguntaId, deletedAt: null },
        data: { deletedAt: new Date(), deletedBy: userId },
      });
      for (const [ordem, opcaoRespostaId] of opcaoRespostaIds.entries()) {
        await tx.inspecaoSegurancaGrupoOpcaoRespostaRelacao.create({
          data: { grupoPerguntaId, opcaoRespostaId, ordem, createdBy: userId },
        });
      }
    });
  }
}

export class InspecaoSegurancaModeloRepository extends AbstractCrudRepository<
  InspecaoSegurancaModelo,
  Filter
> {
  create(data: Prisma.InspecaoSegurancaModeloCreateInput) {
    return prisma.inspecaoSegurancaModelo.create({ data });
  }

  update(id: number, data: Prisma.InspecaoSegurancaModeloUpdateInput, userId?: string) {
    return prisma.inspecaoSegurancaModelo.update({
      where: { id },
      data: { ...data, updatedBy: userId || 'system', updatedAt: new Date() },
    });
  }

  delete(id: number, userId: string) {
    return prisma.inspecaoSegurancaModelo.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
    });
  }

  findById(id: number) {
    return prisma.inspecaoSegurancaModelo.findUnique({
      where: { id, deletedAt: null },
      include: this.getDefaultInclude(),
    });
  }

  protected getSearchFields() {
    return ['nome', 'descricao'];
  }

  protected getDefaultInclude() {
    return {
      tipo: true,
      contrato: true,
      gruposRelacao: {
        where: { deletedAt: null },
        orderBy: { ordem: 'asc' as const },
        include: { grupoPergunta: true },
      },
    };
  }

  protected findMany(
    where: GenericPrismaWhereInput,
    orderBy: GenericPrismaOrderByInput,
    skip: number,
    take: number,
    include?: GenericPrismaIncludeInput
  ) {
    return prisma.inspecaoSegurancaModelo.findMany({
      where,
      orderBy,
      skip,
      take,
      include: include || this.getDefaultInclude(),
    });
  }

  protected count(where: GenericPrismaWhereInput) {
    return prisma.inspecaoSegurancaModelo.count({ where });
  }

  async setGrupos(modeloId: number, grupoPerguntaIds: number[], userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.inspecaoSegurancaModeloGrupoRelacao.updateMany({
        where: { modeloId, deletedAt: null },
        data: { deletedAt: new Date(), deletedBy: userId },
      });
      for (const [ordem, grupoPerguntaId] of grupoPerguntaIds.entries()) {
        await tx.inspecaoSegurancaModeloGrupoRelacao.create({
          data: { modeloId, grupoPerguntaId, ordem, createdBy: userId },
        });
      }
    });
  }
}
