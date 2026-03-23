import {
  ProjStatusProjeto,
  type ProjResultadoViabilizacao,
  type ProjResultadoValidacaoViabilizacao,
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
  ProjStatusProjeto.EM_CORRECAO,
  ProjStatusProjeto.VIABILIZADO_PARCIAL,
] as const;

const EMPTY_PROJETOS_VIABILIZACAO_ETAG =
  'p=0|pu=|pd=|v=0|vu=|vd=|vc=|vv=0|vvu=|vvd=|vvc=|vva=|pp=0|ppu=|ppd=|ppc=|pe=0|peu=|ped=|pec=|pr=0|pru=|prd=|prc=|va=0|vau=|vad=|vac=|cp=0|cpu=|cpd=|cpc=';

function buildProjetoSyncWhere(contractIds: number[]) {
  return {
    deletedAt: null,
    contratoId: { in: contractIds },
    status: { in: [...MOBILE_VIABILIZACAO_STATUSES] },
    contrato: { deletedAt: null },
  };
}

export async function listProjetosParaViabilizacao(
  prisma: PrismaService,
  contractIds: number[],
): Promise<ListProjetosParaViabilizacaoResponseContract> {
  if (contractIds.length === 0) {
    return { items: [], total: 0 };
  }

  const projetos = await prisma.projetoProgramacao.findMany({
    where: buildProjetoSyncWhere(contractIds),
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
      validacoes: {
        where: { deletedAt: null },
        orderBy: [{ validadaEm: 'desc' }, { createdAt: 'desc' }],
        take: 1,
        select: {
          id: true,
          resultado: true,
          validadaEm: true,
          observacao: true,
        },
      },
      postes: {
        where: { deletedAt: null },
        orderBy: [{ ordem: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          viabilizacaoId: true,
          validacaoId: true,
          tipoPosteId: true,
          latitude: true,
          longitude: true,
          ordem: true,
          observacao: true,
          cadastroPoste: {
            select: {
              id: true,
              identificador: true,
              numeroPoste: true,
            },
          },
          estruturas: {
            where: { deletedAt: null },
            orderBy: [{ id: 'asc' }],
            select: {
              id: true,
              tipoEstruturaId: true,
            },
          },
          ramaisPrevistos: {
            where: { deletedAt: null },
            orderBy: [{ id: 'asc' }],
            select: {
              id: true,
              tipoRamalId: true,
              quantidadePrevista: true,
            },
          },
        },
      },
      vaos: {
        where: { deletedAt: null },
        orderBy: [{ id: 'asc' }],
        select: {
          id: true,
          viabilizacaoId: true,
          validacaoId: true,
          posteOrigemId: true,
          posteDestinoId: true,
          materialCondutorId: true,
          observacao: true,
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  const items: ProjetoParaViabilizacaoContract[] = projetos.map((projeto) => {
    const ultimaViabilizacao = projeto.viabilizacoes[0] ?? null;
    const ultimaValidacao = projeto.validacoes[0] ?? null;
    const escopoAtual = {
      postes: projeto.postes.map((poste) => ({
        id: poste.id,
        cadastroPoste: poste.cadastroPoste,
        viabilizacaoId: poste.viabilizacaoId,
        validacaoId: poste.validacaoId,
        tipoPosteId: poste.tipoPosteId,
        latitude: poste.latitude?.toString() ?? null,
        longitude: poste.longitude?.toString() ?? null,
        ordem: poste.ordem,
        observacao: poste.observacao,
        estruturas: poste.estruturas.map((estrutura) => ({
          id: estrutura.id,
          tipoEstruturaId: estrutura.tipoEstruturaId,
        })),
        ramaisPrevistos: poste.ramaisPrevistos.map((ramal) => ({
          id: ramal.id,
          tipoRamalId: ramal.tipoRamalId,
          quantidadePrevista: ramal.quantidadePrevista,
        })),
      })),
      vaos: projeto.vaos.map((vao) => ({
        id: vao.id,
        viabilizacaoId: vao.viabilizacaoId,
        validacaoId: vao.validacaoId,
        posteOrigemId: vao.posteOrigemId,
        posteDestinoId: vao.posteDestinoId,
        materialCondutorId: vao.materialCondutorId,
        observacao: vao.observacao,
      })),
    };
    const hasEscopoAtual =
      escopoAtual.postes.length > 0 ||
      escopoAtual.vaos.length > 0 ||
      ultimaViabilizacao !== null;

    return {
      id: projeto.id,
      contrato: projeto.contrato,
      numeroProjeto: projeto.numeroProjeto,
      descricao: projeto.descricao,
      equipamento: projeto.equipamento,
      municipio: projeto.municipio,
      observacao: projeto.observacao,
      status: toContractStatus(projeto.status),
      tipoViabilizacaoPendente: toTipoViabilizacaoPendente(
        projeto.status,
        hasEscopoAtual,
      ),
      ultimaViabilizacao: ultimaViabilizacao
        ? {
            id: ultimaViabilizacao.id,
            resultado: toResultadoViabilizacao(ultimaViabilizacao.resultado),
            dataViabilizacao: ultimaViabilizacao.dataViabilizacao,
            enviadaEm: ultimaViabilizacao.enviadaEm,
            observacao: ultimaViabilizacao.observacao,
          }
        : null,
      ultimaValidacao: ultimaValidacao
        ? {
            id: ultimaValidacao.id,
            resultado: toResultadoValidacao(ultimaValidacao.resultado),
            validadaEm: ultimaValidacao.validadaEm,
            observacao: ultimaValidacao.observacao,
          }
        : null,
      escopoAtual,
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
    return EMPTY_PROJETOS_VIABILIZACAO_ETAG;
  }

  return formatProjetosParaViabilizacaoEtag(
    await getProjetosParaViabilizacaoAggregates(prisma, contractIds),
  );
}

async function getProjetosParaViabilizacaoAggregates(
  prisma: PrismaService,
  contractIds: number[],
) {
  const projetoWhere = buildProjetoSyncWhere(contractIds);

  const [
    projetosAgg,
    viabilizacoesAgg,
    validacoesAgg,
    postesAgg,
    postesEstruturasAgg,
    postesRamaisAgg,
    vaosAgg,
    cadastroPostesAgg,
  ] = await Promise.all([
    prisma.projetoProgramacao.aggregate({
      where: projetoWhere,
      _count: { id: true },
      _max: { updatedAt: true, deletedAt: true },
    }),
    prisma.projViabilizacao.aggregate({
      where: {
        deletedAt: null,
        projeto: projetoWhere,
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projValidacaoViabilizacao.aggregate({
      where: {
        deletedAt: null,
        projeto: projetoWhere,
      },
      _count: { id: true },
      _max: {
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        validadaEm: true,
      },
    }),
    prisma.projPoste.aggregate({
      where: {
        deletedAt: null,
        projeto: projetoWhere,
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projPosteEstrutura.aggregate({
      where: {
        deletedAt: null,
        poste: {
          deletedAt: null,
          projeto: projetoWhere,
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projPosteRamal.aggregate({
      where: {
        deletedAt: null,
        poste: {
          deletedAt: null,
          projeto: projetoWhere,
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projVao.aggregate({
      where: {
        deletedAt: null,
        projeto: projetoWhere,
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projCadastroPoste.aggregate({
      where: {
        deletedAt: null,
        projetoPostes: {
          some: {
            deletedAt: null,
            projeto: projetoWhere,
          },
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
  ]);

  return {
    projetosAgg,
    viabilizacoesAgg,
    validacoesAgg,
    postesAgg,
    postesEstruturasAgg,
    postesRamaisAgg,
    vaosAgg,
    cadastroPostesAgg,
  };
}

function formatProjetosParaViabilizacaoEtag(aggregates: {
  projetosAgg: AggregateWithIdCount;
  viabilizacoesAgg: AggregateWithIdCount;
  validacoesAgg: AggregateWithIdCount;
  postesAgg: AggregateWithIdCount;
  postesEstruturasAgg: AggregateWithIdCount;
  postesRamaisAgg: AggregateWithIdCount;
  vaosAgg: AggregateWithIdCount;
  cadastroPostesAgg: AggregateWithIdCount;
}): string {
  const {
    projetosAgg,
    viabilizacoesAgg,
    validacoesAgg,
    postesAgg,
    postesEstruturasAgg,
    postesRamaisAgg,
    vaosAgg,
    cadastroPostesAgg,
  } = aggregates;

  return [
    `p=${readAggIdCount(projetosAgg)}`,
    `pu=${readAggMaxIso(projetosAgg, 'updatedAt')}`,
    `pd=${readAggMaxIso(projetosAgg, 'deletedAt')}`,
    `v=${readAggIdCount(viabilizacoesAgg)}`,
    `vu=${readAggMaxIso(viabilizacoesAgg, 'updatedAt')}`,
    `vd=${readAggMaxIso(viabilizacoesAgg, 'deletedAt')}`,
    `vc=${readAggMaxIso(viabilizacoesAgg, 'createdAt')}`,
    `vv=${readAggIdCount(validacoesAgg)}`,
    `vvu=${readAggMaxIso(validacoesAgg, 'updatedAt')}`,
    `vvd=${readAggMaxIso(validacoesAgg, 'deletedAt')}`,
    `vvc=${readAggMaxIso(validacoesAgg, 'createdAt')}`,
    `vva=${readAggMaxIso(validacoesAgg, 'validadaEm')}`,
    `pp=${readAggIdCount(postesAgg)}`,
    `ppu=${readAggMaxIso(postesAgg, 'updatedAt')}`,
    `ppd=${readAggMaxIso(postesAgg, 'deletedAt')}`,
    `ppc=${readAggMaxIso(postesAgg, 'createdAt')}`,
    `pe=${readAggIdCount(postesEstruturasAgg)}`,
    `peu=${readAggMaxIso(postesEstruturasAgg, 'updatedAt')}`,
    `ped=${readAggMaxIso(postesEstruturasAgg, 'deletedAt')}`,
    `pec=${readAggMaxIso(postesEstruturasAgg, 'createdAt')}`,
    `pr=${readAggIdCount(postesRamaisAgg)}`,
    `pru=${readAggMaxIso(postesRamaisAgg, 'updatedAt')}`,
    `prd=${readAggMaxIso(postesRamaisAgg, 'deletedAt')}`,
    `prc=${readAggMaxIso(postesRamaisAgg, 'createdAt')}`,
    `va=${readAggIdCount(vaosAgg)}`,
    `vau=${readAggMaxIso(vaosAgg, 'updatedAt')}`,
    `vad=${readAggMaxIso(vaosAgg, 'deletedAt')}`,
    `vac=${readAggMaxIso(vaosAgg, 'createdAt')}`,
    `cp=${readAggIdCount(cadastroPostesAgg)}`,
    `cpu=${readAggMaxIso(cadastroPostesAgg, 'updatedAt')}`,
    `cpd=${readAggMaxIso(cadastroPostesAgg, 'deletedAt')}`,
    `cpc=${readAggMaxIso(cadastroPostesAgg, 'createdAt')}`,
  ].join('|');
}

type AggregateWithIdCount = {
  _count?: {
    id?: number | null;
  } | null;
  _max?: Record<string, Date | null | undefined> | null;
};

function readAggIdCount(agg: AggregateWithIdCount): number {
  return agg._count?.id ?? 0;
}

function readAggMaxIso(
  agg: AggregateWithIdCount,
  key: string,
): string {
  return agg._max?.[key]?.toISOString() ?? '';
}

function toTipoViabilizacaoPendente(
  status: ProjStatusProjeto,
  hasEscopoAtual: boolean,
): ProjetoTipoViabilizacaoPendenteContract {
  if (
    status === ProjStatusProjeto.VIABILIZADO_PARCIAL ||
    status === ProjStatusProjeto.EM_CORRECAO ||
    hasEscopoAtual
  ) {
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
    case ProjStatusProjeto.EM_CORRECAO:
      return 'EM_CORRECAO';
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

function toResultadoValidacao(
  resultado: ProjResultadoValidacaoViabilizacao,
): 'APROVADA' | 'CORRIGIDA' | 'REJEITADA' {
  return resultado;
}
