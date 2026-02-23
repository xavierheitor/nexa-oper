import type { PrismaService } from '../../database/prisma.service';
import { AppError } from '../../core/errors/app-error';
import type { SyncMode } from './dto/sync-manifest.dto';
import type {
  SyncCollectionDefInput,
  SyncCustomDef,
  SyncScope,
  SyncTableDef,
} from './sync-collection.types';
import { SYNC_DEFINITIONS } from './sync-collections.def';

export type CollectionName = (typeof SYNC_DEFINITIONS)[number]['name'];

export interface SyncCollectionDef {
  name: CollectionName;
  mode: SyncMode;

  computeEtag: (prisma: PrismaService, scope: SyncScope) => Promise<string>;

  snapshot?: (prisma: PrismaService, scope: SyncScope) => Promise<unknown[]>;

  delta?: (
    prisma: PrismaService,
    scope: SyncScope,
    params: { since: string; until: Date },
  ) => Promise<{ items: unknown[]; deletedIds: string[]; nextSince: string }>;
}

export type { SyncScope };

function iso(d: Date) {
  return d.toISOString();
}

function buildNestedWhere(
  path: string,
  value: Record<string, unknown>,
): Record<string, unknown> {
  const parts = path.split('.').filter(Boolean);
  if (!parts.length) return {};

  return parts.reduceRight<Record<string, unknown>>(
    (acc, part) => ({ [part]: acc }),
    value,
  );
}

function contractWhere(
  contractIds: number[],
  field: string | false = 'contratoId',
): Record<string, unknown> {
  if (field === false) return {};
  if (!contractIds.length) return { id: -1 };

  return buildNestedWhere(field, { in: contractIds });
}

function buildTableCollection(def: SyncTableDef): SyncCollectionDef {
  const cf = def.contractField !== undefined ? def.contractField : 'contratoId';
  const whereFn = (ids: number[]) => contractWhere(ids, cf);
  const modelName = def.model;

  const computeEtag = async (prisma: PrismaService, scope: SyncScope) => {
    const where = whereFn(scope.contractIds);
    const repo = (
      prisma as unknown as Record<
        string,
        { aggregate: (opts: unknown) => Promise<unknown> }
      >
    )[modelName];
    if (!repo) throw AppError.internal(`Prisma model not found: ${modelName}`);

    const agg = (await repo.aggregate({
      where,
      _count: { id: true },
      _max: { updatedAt: true, deletedAt: true },
    })) as {
      _count: { id: number };
      _max: { updatedAt?: Date | null; deletedAt?: Date | null };
    };

    return `c=${agg._count.id}|u=${agg._max.updatedAt?.toISOString() ?? ''}|d=${agg._max.deletedAt?.toISOString() ?? ''}`;
  };

  if (def.mode === 'delta') {
    return {
      name: def.name,
      mode: 'delta',
      computeEtag,
      delta: async (prisma, scope, { since, until }) => {
        const sinceDate = since ? new Date(since) : new Date(0);
        const where = whereFn(scope.contractIds);

        const repo = (
          prisma as unknown as Record<
            string,
            { findMany: (opts: unknown) => Promise<unknown[]> }
          >
        )[modelName];
        if (!repo)
          throw AppError.internal(`Prisma model not found: ${modelName}`);

        const findOpts = {
          where: {
            ...where,
            deletedAt: null,
            updatedAt: { gt: sinceDate, lte: until },
          },
          ...(def.select
            ? { select: def.select }
            : def.include
              ? { include: def.include }
              : {}),
        };
        const items = await repo.findMany(
          findOpts as Parameters<typeof repo.findMany>[0],
        );

        const deleted = await repo.findMany({
          where: {
            ...where,
            deletedAt: { gt: sinceDate, lte: until },
          },
          select: { id: true },
        } as Parameters<typeof repo.findMany>[0]);

        return {
          items,
          deletedIds: (deleted as { id: number }[]).map((x) => String(x.id)),
          nextSince: iso(until),
        };
      },
    };
  }

  return {
    name: def.name,
    mode: 'snapshot',
    computeEtag: async (prisma, scope) => {
      const where = whereFn(scope.contractIds);
      const repo = (
        prisma as unknown as Record<
          string,
          { aggregate: (opts: unknown) => Promise<unknown> }
        >
      )[modelName];
      if (!repo)
        throw AppError.internal(`Prisma model not found: ${modelName}`);
      const agg = (await repo.aggregate({
        where,
        _count: { id: true },
        _max: { updatedAt: true },
      })) as { _count: { id: number }; _max: { updatedAt?: Date | null } };
      return `c=${agg._count.id}|u=${agg._max.updatedAt?.toISOString() ?? ''}`;
    },
    snapshot: async (prisma, scope) => {
      const where = whereFn(scope.contractIds);
      const repo = (
        prisma as unknown as Record<
          string,
          { findMany: (opts: unknown) => Promise<unknown[]> }
        >
      )[modelName];
      if (!repo)
        throw AppError.internal(`Prisma model not found: ${modelName}`);
      const findOpts = {
        where: {
          ...where,
          deletedAt: null,
        },
        ...(def.select
          ? { select: def.select }
          : def.include
            ? { include: def.include }
            : {}),
      };
      return repo.findMany(findOpts as Parameters<typeof repo.findMany>[0]);
    },
  };
}

function buildCustomCollection(def: SyncCustomDef): SyncCollectionDef {
  const out: SyncCollectionDef = {
    name: def.name,
    mode: def.mode,
    computeEtag: def.computeEtag,
  };

  if (def.mode === 'delta') {
    out.delta = async (prisma, scope, params) => {
      const result = await def.resolver(prisma, scope, params);
      if (!result.deletedIds || result.nextSince === undefined) {
        throw AppError.internal(
          `Custom collection ${def.name} (delta) must return deletedIds and nextSince`,
        );
      }
      return {
        items: result.items,
        deletedIds: result.deletedIds,
        nextSince: result.nextSince,
      };
    };
  } else {
    out.snapshot = async (prisma, scope) => {
      const result = await def.resolver(prisma, scope, {
        since: '',
        until: new Date(),
      });
      return result.items;
    };
  }

  return out;
}

function validateDefinitions(definitions: SyncCollectionDefInput[]): void {
  const names = new Set<string>();
  for (const def of definitions) {
    if (names.has(def.name)) {
      throw AppError.internal(`Duplicate sync collection name: ${def.name}`);
    }
    names.add(def.name);
  }
}

export function buildRegistry(
  definitions: SyncCollectionDefInput[],
): SyncCollectionDef[] {
  validateDefinitions(definitions);

  return definitions.map((def) => {
    if (def.type === 'table') return buildTableCollection(def);
    return buildCustomCollection(def);
  });
}

export const SYNC_COLLECTIONS = buildRegistry(SYNC_DEFINITIONS);
