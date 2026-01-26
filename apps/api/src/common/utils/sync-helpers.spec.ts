import { buildSyncStatusResponse } from './sync-status';
import { computeSyncChecksum } from './sync-checksum';
import { normalizeSyncAggregate } from './sync-aggregate';
import { buildSyncPayloadFromAggregates } from './sync-payload';
import { buildSyncWhereIncremental } from './sync-where';

describe('buildSyncPayloadFromAggregates', () => {
  it('retorna chaves corretas e count/maxUpdatedAt em ISO para cada aggregate', () => {
    const map = {
      foo: {
        _count: 3,
        _max: { updatedAt: new Date('2024-03-10T14:30:00.000Z') },
      },
      bar: {
        _count: 0,
        _max: { updatedAt: null },
      },
    };
    const result = buildSyncPayloadFromAggregates(map);
    expect(Object.keys(result).sort()).toEqual(['bar', 'foo']);
    expect(result.foo).toEqual({
      count: 3,
      maxUpdatedAt: '2024-03-10T14:30:00.000Z',
    });
    expect(result.bar).toEqual({ count: 0, maxUpdatedAt: null });
  });
});

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

  it('serverTime é uma string ISO válida', () => {
    const payload = { a: 1 };
    const result = buildSyncStatusResponse(payload);
    expect(new Date(result.serverTime).toISOString()).toBe(result.serverTime);
  });
});
