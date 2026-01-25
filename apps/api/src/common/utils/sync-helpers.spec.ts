import { buildSyncStatusResponse } from './sync-status';
import { computeSyncChecksum } from './sync-checksum';
import { normalizeSyncAggregate } from './sync-aggregate';

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
});
