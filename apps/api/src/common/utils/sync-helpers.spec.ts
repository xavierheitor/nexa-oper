import { buildSyncStatusResponse } from './sync-status';
import { computeSyncChecksum } from './sync-checksum';
import { normalizeSyncAggregate } from './sync-aggregate';
import { buildSyncWhereIncremental } from './sync-where';

describe('buildSyncWhereIncremental', () => {
  it('quando since é undefined, retorna { deletedAt: null }', () => {
    expect(buildSyncWhereIncremental(undefined)).toEqual({ deletedAt: null });
    expect(buildSyncWhereIncremental()).toEqual({ deletedAt: null });
  });

  it('quando since é definido, retorna o OR com updatedAt.gt, deletedAt null e deletedAt.gt', () => {
    const since = '2024-01-15T00:00:00.000Z';
    const result = buildSyncWhereIncremental(since);
    expect(result.OR).toHaveLength(2);
    expect(result.OR[0]).toEqual({
      updatedAt: { gt: new Date(since) },
      deletedAt: null,
    });
    expect(result.OR[1]).toEqual({ deletedAt: { gt: new Date(since) } });
  });
});

describe('normalizeSyncAggregate', () => {
  it('retorna count e maxUpdatedAt em ISO', () => {
    const date = new Date('2024-06-15T12:00:00.000Z');
    const result = normalizeSyncAggregate({
      _count: 42,
      _max: { updatedAt: date },
    });
    expect(result.count).toBe(42);
    expect(result.maxUpdatedAt).toBe('2024-06-15T12:00:00.000Z');
  });

  it('quando _max.updatedAt é null, maxUpdatedAt deve ser null', () => {
    const result = normalizeSyncAggregate({
      _count: 0,
      _max: { updatedAt: null },
    });
    expect(result.count).toBe(0);
    expect(result.maxUpdatedAt).toBeNull();
  });
});

describe('buildSyncStatusResponse', () => {
  it('retorna changed=false quando clientChecksum é igual ao checksum do payload', () => {
    const payload = { foo: 1, bar: 'x' };
    const clientChecksum = computeSyncChecksum(payload);
    const result = buildSyncStatusResponse(payload, clientChecksum);
    expect(result.changed).toBe(false);
    expect(result.checksum).toBe(clientChecksum);
    expect(result.serverTime).toBeDefined();
  });

  it('retorna changed=true quando clientChecksum não é informado', () => {
    const payload = { a: 1 };
    const result = buildSyncStatusResponse(payload);
    expect(result.changed).toBe(true);
    expect(result.checksum).toBe(computeSyncChecksum(payload));
    expect(result.serverTime).toBeDefined();
  });

  it('quando clientChecksum é diferente, changed deve ser true', () => {
    const payload = { x: 1 };
    const result = buildSyncStatusResponse(payload, 'checksum-diferente');
    expect(result.changed).toBe(true);
    expect(result.checksum).toBe(computeSyncChecksum(payload));
  });
});
