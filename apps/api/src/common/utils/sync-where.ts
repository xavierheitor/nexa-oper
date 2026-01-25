/**
 * Uso recomendado: serviços de sync para montar o where incremental (since) nas consultas.
 * Helper de where incremental para sincronização (since).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- forma do OR é compatível com WhereInput de vários modelos Prisma
export function buildSyncWhereIncremental(since?: string): any {
  if (!since) return { deletedAt: null };
  return {
    OR: [
      { updatedAt: { gt: new Date(since) }, deletedAt: null },
      { deletedAt: { gt: new Date(since) } },
    ],
  };
}
