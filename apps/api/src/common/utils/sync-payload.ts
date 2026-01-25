import { normalizeSyncAggregate } from './sync-aggregate';

/**
 * Uso recomendado: serviços de sync para montar o payload de checksum a partir de aggregates.
 * Converte um mapa de aggregates Prisma em { [key]: { count, maxUpdatedAt } }.
 */
export function buildSyncPayloadFromAggregates(
  map: Record<string, { _count: number; _max: { updatedAt: Date | null } }>
): Record<string, { count: number; maxUpdatedAt: string | null }> {
  const out: Record<string, { count: number; maxUpdatedAt: string | null }> = {};
  for (const [key, agg] of Object.entries(map)) {
    out[key] = normalizeSyncAggregate(agg);
  }
  return out;
}
