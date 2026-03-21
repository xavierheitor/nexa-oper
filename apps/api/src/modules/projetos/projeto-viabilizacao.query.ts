import {
  ProjStatusProjeto,
  type ProjResultadoViabilizacao,
} from '@nexa-oper/db';

import type {
  ListProjetosParaViabilizacaoResponseContract,
  ProjetoParaViabilizacaoContract,
  ProjetoTipoViabilizacaoPendenteContract,
  ProjetoViabilizacaoStatusContract,
} from '../../contracts/projeto/projeto-viabilizacao.contract';
import type { PrismaService } from '../../database/prisma.service';

export const MOBILE_VIABILIZACAO_STATUSES = [
  ProjStatusProjeto.PENDENTE,
  ProjStatusProjeto.EM_VIABILIZACAO,
  ProjStatusProjeto.VIABILIZADO_PARCIAL,
] as const;

export async function listProjetosParaViabilizacao(
  prisma: PrismaService,
  contractIds: number[],
): Promise<ListProjetosParaViabilizacaoResponseContract> {
  if (contractIds.length === 0) {
    return { items: [], total: 0 };
  }

  const projetos = await prisma.projetoProgramacao.findMany({
    where: {
      deletedAt: null,
      contratoId: { in: contractIds },
      status: { in: [...MOBILE_VIABILIZACAO_STATUSES] },
      contrato: { deletedAt: null },
    },
    select: {
      id: true,
      numeroProjeto: true,
      descricao: true,
      equipamento: true,
      municipio: true,
      observacao: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      contrato: {
        select: {
          id: true,
          nome: true,
          numero: true,
        },
      },
      viabilizacoes: {
        where: { deletedAt: null },
        orderBy: [{ dataViabilizacao: 'desc' }, { createdAt: 'desc' }],
        take: 1,
        select: {
          id: true,
          resultado: true,
          dataViabilizacao: true,
          enviadaEm: true,
          observacao: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  const items: ProjetoParaViabilizacaoContract[] = projetos.map((projeto) => {
    const ultimaViabilizacao = projeto.viabilizacoes[0] ?? null;

    return {
      id: projeto.id,
      contrato: projeto.contrato,
      numeroProjeto: projeto.numeroProjeto,
      descricao: projeto.descricao,
      equipamento: projeto.equipamento,
      municipio: projeto.municipio,
      observacao: projeto.observacao,
      status: toContractStatus(projeto.status),
      tipoViabilizacaoPendente: toTipoViabilizacaoPendente(projeto.status),
      ultimaViabilizacao: ultimaViabilizacao
        ? {
            id: ultimaViabilizacao.id,
            resultado: toResultadoViabilizacao(ultimaViabilizacao.resultado),
            dataViabilizacao: ultimaViabilizacao.dataViabilizacao,
            enviadaEm: ultimaViabilizacao.enviadaEm,
            observacao: ultimaViabilizacao.observacao,
          }
        : null,
      createdAt: projeto.createdAt,
      updatedAt: projeto.updatedAt,
    };
  });

  return {
    items,
    total: items.length,
  };
}

export async function computeProjetosParaViabilizacaoEtag(
  prisma: PrismaService,
  contractIds: number[],
): Promise<string> {
  if (contractIds.length === 0) {
    return 'p=0|pu=|pd=|v=0|vu=|vd=|vc=';
  }

  const [projetosAgg, viabilizacoesAgg] = await Promise.all([
    prisma.projetoProgramacao.aggregate({
      where: {
        deletedAt: null,
        contratoId: { in: contractIds },
        status: { in: [...MOBILE_VIABILIZACAO_STATUSES] },
        contrato: { deletedAt: null },
      },
      _count: { id: true },
      _max: { updatedAt: true, deletedAt: true },
    }),
    prisma.projViabilizacao.aggregate({
      where: {
        deletedAt: null,
        projeto: {
          deletedAt: null,
          contratoId: { in: contractIds },
          status: { in: [...MOBILE_VIABILIZACAO_STATUSES] },
          contrato: { deletedAt: null },
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
  ]);

  return [
    `p=${projetosAgg._count.id}`,
    `pu=${projetosAgg._max.updatedAt?.toISOString() ?? ''}`,
    `pd=${projetosAgg._max.deletedAt?.toISOString() ?? ''}`,
    `v=${viabilizacoesAgg._count.id}`,
    `vu=${viabilizacoesAgg._max.updatedAt?.toISOString() ?? ''}`,
    `vd=${viabilizacoesAgg._max.deletedAt?.toISOString() ?? ''}`,
    `vc=${viabilizacoesAgg._max.createdAt?.toISOString() ?? ''}`,
  ].join('|');
}

function toTipoViabilizacaoPendente(
  status: ProjStatusProjeto,
): ProjetoTipoViabilizacaoPendenteContract {
  if (status === ProjStatusProjeto.VIABILIZADO_PARCIAL) {
    return 'PARCIAL';
  }

  return 'TOTAL';
}

function toContractStatus(
  status: ProjStatusProjeto,
): ProjetoViabilizacaoStatusContract {
  switch (status) {
    case ProjStatusProjeto.PENDENTE:
      return 'PENDENTE';
    case ProjStatusProjeto.EM_VIABILIZACAO:
      return 'EM_VIABILIZACAO';
    case ProjStatusProjeto.VIABILIZADO_PARCIAL:
      return 'VIABILIZADO_PARCIAL';
      default:
        return 'PENDENTE';
  }
}

function toResultadoViabilizacao(
  resultado: ProjResultadoViabilizacao,
): 'PARCIAL' | 'TOTAL' {
  return resultado === 'PARCIAL' ? 'PARCIAL' : 'TOTAL';
}
