import { ProjStatusProjeto } from '@nexa-oper/db';

import type {
  ProjetoEscopoAtualContract,
  ProjetoEscopoPosteContract,
  ProjetoEscopoVaoContract,
  ListProjetosParaViabilizacaoResponseContract,
  ProjetoParaViabilizacaoContract,
  ProjetoTipoViabilizacaoPendenteContract,
  ProjetoUltimaValidacaoViabilizacaoContract,
  ProjetoViabilizacaoStatusContract,
} from '../../contracts/projeto/projeto-viabilizacao.contract';
import type { PrismaService } from '../../database/prisma.service';

export const MOBILE_VIABILIZACAO_STATUSES = [
  ProjStatusProjeto.PENDENTE,
  ProjStatusProjeto.EM_VIABILIZACAO,
  ProjStatusProjeto.AGUARDANDO_VALIDACAO,
  ProjStatusProjeto.EM_CORRECAO,
  ProjStatusProjeto.VIABILIZADO_PARCIAL,
  ProjStatusProjeto.VIABILIZADO_TOTAL,
] as const;

const EMPTY_PROJETOS_VIABILIZACAO_ETAG =
  'p=0|pu=|pd=|v=0|vu=|vd=|vc=|vv=0|vvu=|vvd=|vvc=|pp=0|ppu=|ppd=|ppc=|pe=0|peu=|ped=|pec=|pr=0|pru=|prd=|prc=|va=0|vau=|vad=|vac=';

function buildProjetoSyncWhere(contractIds: number[]) {
  return {
    deletedAt: null,
    status: { in: [...MOBILE_VIABILIZACAO_STATUSES] },
    programa: {
      deletedAt: null,
      contratoId: { in: contractIds },
      contrato: { deletedAt: null },
    },
  };
}

export async function listProjetosParaViabilizacao(
  prisma: PrismaService,
  contractIds: number[],
): Promise<ListProjetosParaViabilizacaoResponseContract> {
  if (contractIds.length === 0) {
    return { items: [], total: 0 };
  }

  const projetos = await prisma.projProjeto.findMany({
    where: buildProjetoSyncWhere(contractIds),
    select: {
      id: true,
      numeroProjeto: true,
      descricao: true,
      equipamento: true,
      municipio: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      programa: {
        select: {
          id: true,
          nome: true,
          contrato: {
            select: {
              id: true,
              nome: true,
              numero: true,
            },
          },
        },
      },
      viabilizacoes: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          data: true,
          observacao: true,
          createdAt: true,
          updatedAt: true,
          postes: {
            where: { deletedAt: null },
            orderBy: [{ id: 'asc' }],
            select: {
              id: true,
              viabilizacaoId: true,
              tipoPosteId: true,
              cadastro: true,
              uuid: true,
              latitude: true,
              longitude: true,
              createdAt: true,
              updatedAt: true,
              estruturas: {
                where: { deletedAt: null },
                orderBy: [{ id: 'asc' }],
                select: {
                  id: true,
                  estruturaId: true,
                },
              },
              ramais: {
                where: { deletedAt: null },
                orderBy: [{ id: 'asc' }],
                select: {
                  id: true,
                  tipoRamalId: true,
                },
              },
              projValidacaoViabilizacaos: {
                where: { deletedAt: null },
                orderBy: [
                  { data: 'desc' },
                  { createdAt: 'desc' },
                  { id: 'desc' },
                ],
                take: 1,
                select: {
                  id: true,
                  data: true,
                  observacao: true,
                  createdAt: true,
                  updatedAt: true,
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
              posteInicioId: true,
              posteFimId: true,
              materialCondutorId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  });

  const items: ProjetoParaViabilizacaoContract[] = projetos.map((projeto) => {
    const ultimaViabilizacao = projeto.viabilizacoes.at(-1) ?? null;
    const escopoAtual = buildEscopoAtual(projeto.viabilizacoes);
    const ultimaValidacao = resolveLatestValidation(escopoAtual.postes);
    const hasEscopoAtual =
      escopoAtual.postes.length > 0 ||
      escopoAtual.vaos.length > 0 ||
      ultimaViabilizacao !== null;

    return {
      id: projeto.id,
      contrato: projeto.programa.contrato,
      programa: {
        id: projeto.programa.id,
        nome: projeto.programa.nome,
      },
      numeroProjeto: projeto.numeroProjeto,
      descricao: projeto.descricao,
      equipamento: projeto.equipamento,
      municipio: projeto.municipio,
      status: toContractStatus(projeto.status),
      tipoViabilizacaoPendente: toTipoViabilizacaoPendente(hasEscopoAtual),
      ultimaViabilizacao: ultimaViabilizacao
        ? {
            id: ultimaViabilizacao.id,
            data: ultimaViabilizacao.data,
            observacao: ultimaViabilizacao.observacao,
            createdAt: ultimaViabilizacao.createdAt,
            updatedAt: ultimaViabilizacao.updatedAt,
          }
        : null,
      ultimaValidacao,
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
  ] = await Promise.all([
    prisma.projProjeto.aggregate({
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
        poste: {
          deletedAt: null,
          viabilizacao: {
            deletedAt: null,
            projeto: projetoWhere,
          },
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projPoste.aggregate({
      where: {
        deletedAt: null,
        viabilizacao: {
          deletedAt: null,
          projeto: projetoWhere,
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projPosteEstruturas.aggregate({
      where: {
        deletedAt: null,
        poste: {
          deletedAt: null,
          viabilizacao: {
            deletedAt: null,
            projeto: projetoWhere,
          },
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projPosteRamais.aggregate({
      where: {
        deletedAt: null,
        poste: {
          deletedAt: null,
          viabilizacao: {
            deletedAt: null,
            projeto: projetoWhere,
          },
        },
      },
      _count: { id: true },
      _max: { createdAt: true, updatedAt: true, deletedAt: true },
    }),
    prisma.projVao.aggregate({
      where: {
        deletedAt: null,
        viabilizacao: {
          deletedAt: null,
          projeto: projetoWhere,
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
}): string {
  const {
    projetosAgg,
    viabilizacoesAgg,
    validacoesAgg,
    postesAgg,
    postesEstruturasAgg,
    postesRamaisAgg,
    vaosAgg,
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

function readAggMaxIso(agg: AggregateWithIdCount, key: string): string {
  return agg._max?.[key]?.toISOString() ?? '';
}

function resolveLatestValidation(
  postes: ProjetoEscopoPosteContract[],
): ProjetoUltimaValidacaoViabilizacaoContract | null {
  const latest = postes
    .flatMap((poste) => (poste.ultimaValidacao ? [poste.ultimaValidacao] : []))
    .sort((left, right) => {
      const byData = right.data.getTime() - left.data.getTime();
      if (byData !== 0) {
        return byData;
      }

      const byCreatedAt = right.createdAt.getTime() - left.createdAt.getTime();
      if (byCreatedAt !== 0) {
        return byCreatedAt;
      }

      return right.id - left.id;
    })[0];

  if (!latest) {
    return null;
  }

  return {
    id: latest.id,
    posteId: latest.posteId,
    data: latest.data,
    observacao: latest.observacao,
    createdAt: latest.createdAt,
    updatedAt: latest.updatedAt,
  };
}

type RawProjetoViabilizacao = {
  id: number;
  data: string;
  observacao: string;
  createdAt: Date;
  updatedAt: Date | null;
  postes: RawProjetoPoste[];
  vaos: RawProjetoVao[];
};

type RawProjetoPoste = {
  id: number;
  viabilizacaoId: number;
  tipoPosteId: number;
  cadastro: string;
  uuid: string;
  latitude: { toString(): string } | null;
  longitude: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date | null;
  estruturas: Array<{
    id: number;
    estruturaId: number;
  }>;
  ramais: Array<{
    id: number;
    tipoRamalId: number;
  }>;
  projValidacaoViabilizacaos: Array<{
    id: number;
    data: Date;
    observacao: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  }>;
};

type RawProjetoVao = {
  id: number;
  viabilizacaoId: number;
  posteInicioId: number;
  posteFimId: number;
  materialCondutorId: number;
  createdAt: Date;
  updatedAt: Date | null;
};

function buildEscopoAtual(
  viabilizacoes: RawProjetoViabilizacao[],
): ProjetoEscopoAtualContract {
  if (viabilizacoes.length === 0) {
    return {
      viabilizacaoId: null,
      postes: [],
      vaos: [],
    };
  }

  const canonicalPosteByLookupKey = new Map<string, string>();
  const canonicalPosteByRawId = new Map<number, string>();
  const postesByCanonicalKey = new Map<string, ProjetoEscopoPosteContract>();

  for (const viabilizacao of viabilizacoes) {
    for (const poste of viabilizacao.postes) {
      const canonicalKey = resolveCanonicalPosteKey(
        poste,
        canonicalPosteByLookupKey,
      );

      canonicalPosteByRawId.set(poste.id, canonicalKey);
      postesByCanonicalKey.set(canonicalKey, mapPosteToEscopo(poste));
    }
  }

  const vaosByCanonicalKey = new Map<string, ProjetoEscopoVaoContract>();

  for (const viabilizacao of viabilizacoes) {
    for (const vao of viabilizacao.vaos) {
      const posteInicioCanonical =
        canonicalPosteByRawId.get(vao.posteInicioId) ??
        buildPosteIdFallbackKey(vao.posteInicioId);
      const posteFimCanonical =
        canonicalPosteByRawId.get(vao.posteFimId) ??
        buildPosteIdFallbackKey(vao.posteFimId);

      const posteInicioAtualId =
        postesByCanonicalKey.get(posteInicioCanonical)?.id ?? vao.posteInicioId;
      const posteFimAtualId =
        postesByCanonicalKey.get(posteFimCanonical)?.id ?? vao.posteFimId;

      vaosByCanonicalKey.set(
        buildCanonicalVaoKey(posteInicioCanonical, posteFimCanonical),
        mapVaoToEscopo(vao, posteInicioAtualId, posteFimAtualId),
      );
    }
  }

  return {
    viabilizacaoId: viabilizacoes.at(-1)?.id ?? null,
    postes: [...postesByCanonicalKey.values()].sort(sortEscopoPostes),
    vaos: [...vaosByCanonicalKey.values()].sort(sortEscopoVaos),
  };
}

function resolveCanonicalPosteKey(
  poste: RawProjetoPoste,
  canonicalPosteByLookupKey: Map<string, string>,
): string {
  const candidateKeys = buildPosteLookupKeys(poste);
  const existingCanonical = candidateKeys
    .map((key) => canonicalPosteByLookupKey.get(key))
    .find((value): value is string => value !== undefined);
  const canonicalKey =
    existingCanonical ?? candidateKeys[0] ?? buildPosteIdFallbackKey(poste.id);

  for (const key of candidateKeys) {
    canonicalPosteByLookupKey.set(key, canonicalKey);
  }

  return canonicalKey;
}

function buildPosteLookupKeys(poste: RawProjetoPoste): string[] {
  const uuidKey = normalizeText(poste.uuid);
  const cadastroKey = normalizeText(poste.cadastro);
  const keys = [
    uuidKey ? `uuid:${uuidKey}` : null,
    cadastroKey ? `cadastro:${cadastroKey}` : null,
    buildPosteIdFallbackKey(poste.id),
  ].filter((value): value is string => value !== null);

  return [...new Set(keys)];
}

function buildPosteIdFallbackKey(posteId: number): string {
  return `poste-id:${posteId}`;
}

function buildCanonicalVaoKey(
  posteInicioCanonical: string,
  posteFimCanonical: string,
): string {
  return [posteInicioCanonical, posteFimCanonical].sort().join('|');
}

function mapPosteToEscopo(poste: RawProjetoPoste): ProjetoEscopoPosteContract {
  const ultimaValidacao = poste.projValidacaoViabilizacaos[0] ?? null;

  return {
    id: poste.id,
    viabilizacaoId: poste.viabilizacaoId,
    tipoPosteId: poste.tipoPosteId,
    cadastro: poste.cadastro,
    uuid: poste.uuid,
    latitude: poste.latitude?.toString() ?? null,
    longitude: poste.longitude?.toString() ?? null,
    estruturas: poste.estruturas.map((estrutura) => ({
      id: estrutura.id,
      estruturaId: estrutura.estruturaId,
    })),
    ramais: poste.ramais.map((ramal) => ({
      id: ramal.id,
      tipoRamalId: ramal.tipoRamalId,
    })),
    ultimaValidacao: ultimaValidacao
      ? {
          id: ultimaValidacao.id,
          posteId: poste.id,
          data: ultimaValidacao.data,
          observacao: ultimaValidacao.observacao,
          createdAt: ultimaValidacao.createdAt,
          updatedAt: ultimaValidacao.updatedAt,
        }
      : null,
    createdAt: poste.createdAt,
    updatedAt: poste.updatedAt,
  };
}

function mapVaoToEscopo(
  vao: RawProjetoVao,
  posteInicioId: number,
  posteFimId: number,
): ProjetoEscopoVaoContract {
  return {
    id: vao.id,
    viabilizacaoId: vao.viabilizacaoId,
    posteInicioId,
    posteFimId,
    materialCondutorId: vao.materialCondutorId,
    createdAt: vao.createdAt,
    updatedAt: vao.updatedAt,
  };
}

function normalizeText(value: string): string | null {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  return normalized.toUpperCase();
}

function sortEscopoPostes(
  left: ProjetoEscopoPosteContract,
  right: ProjetoEscopoPosteContract,
): number {
  return (
    left.cadastro.localeCompare(right.cadastro) ||
    left.uuid.localeCompare(right.uuid) ||
    left.id - right.id
  );
}

function sortEscopoVaos(
  left: ProjetoEscopoVaoContract,
  right: ProjetoEscopoVaoContract,
): number {
  return (
    left.posteInicioId - right.posteInicioId ||
    left.posteFimId - right.posteFimId ||
    left.id - right.id
  );
}

function toTipoViabilizacaoPendente(
  hasEscopoAtual: boolean,
): ProjetoTipoViabilizacaoPendenteContract {
  return hasEscopoAtual ? 'PARCIAL' : 'TOTAL';
}

function toContractStatus(
  status: ProjStatusProjeto,
): ProjetoViabilizacaoStatusContract {
  switch (status) {
    case ProjStatusProjeto.PENDENTE:
      return 'PENDENTE';
    case ProjStatusProjeto.EM_VIABILIZACAO:
      return 'EM_VIABILIZACAO';
    case ProjStatusProjeto.AGUARDANDO_VALIDACAO:
      return 'AGUARDANDO_VALIDACAO';
    case ProjStatusProjeto.EM_CORRECAO:
      return 'EM_CORRECAO';
    case ProjStatusProjeto.VIABILIZADO_PARCIAL:
      return 'VIABILIZADO_PARCIAL';
    case ProjStatusProjeto.VIABILIZADO_TOTAL:
      return 'VIABILIZADO_TOTAL';
    default:
      return 'PENDENTE';
  }
}
