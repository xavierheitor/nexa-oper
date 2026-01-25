/**
 * Uso recomendado: serviços de sync para normalizar aggregate Prisma antes do checksum.
 * Converte o resultado de aggregate Prisma (_count, _max.updatedAt)
 * para o formato do payload de checksum (count, maxUpdatedAt em ISO).
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
