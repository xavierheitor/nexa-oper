/**
 * Converte o resultado de aggregate Prisma (_count, _max.updatedAt)
 * para o formato do payload de checksum (count, maxUpdatedAt em ISO).
 * Usado por APR, Checklist, Equipe e Eletricista sync.
 */
export function normalizeSyncAggregate(aggregate: {
  _count: number;
  _max: { updatedAt: Date | null };
}): { count: number; maxUpdatedAt: string | null } {
  return {
    count: aggregate._count,
    maxUpdatedAt: aggregate._max.updatedAt?.toISOString() ?? null,
  };
}
