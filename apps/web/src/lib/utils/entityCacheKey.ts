import type { Key } from 'swr';
import type { PaginatedParams } from '../types/common';

const ENTITY_CACHE_PREFIX = 'entity-cache';

export function buildEntityCacheKey(
  baseKey: string,
  params?: PaginatedParams
): string {
  const normalizedBaseKey = baseKey.trim();

  if (!params) {
    return `${ENTITY_CACHE_PREFIX}:${normalizedBaseKey}`;
  }

  return `${ENTITY_CACHE_PREFIX}:${normalizedBaseKey}:${JSON.stringify(params)}`;
}

export function isEntityCacheKeyMatch(cacheKey: Key, baseKey: string): boolean {
  if (typeof cacheKey !== 'string') {
    return false;
  }

  const normalizedPrefix = `${ENTITY_CACHE_PREFIX}:${baseKey.trim()}`;
  return (
    cacheKey === normalizedPrefix ||
    cacheKey.startsWith(`${normalizedPrefix}:`)
  );
}
