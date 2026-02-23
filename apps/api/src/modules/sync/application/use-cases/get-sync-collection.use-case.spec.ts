import { GetSyncCollectionUseCase } from './get-sync-collection.use-case';

describe('GetSyncCollectionUseCase', () => {
  it('loads snapshot collection when mode is snapshot', async () => {
    const reader = {
      getCollectionDef: jest.fn().mockReturnValue({
        name: 'veiculo',
        mode: 'snapshot',
      }),
      getCollectionSnapshot: jest.fn().mockResolvedValue({
        serverTime: '2026-01-01T00:00:00.000Z',
        nextSince: null,
        items: [{ id: 1 }],
        deletedIds: [],
      }),
      getCollectionDelta: jest.fn(),
    };

    const useCase = new GetSyncCollectionUseCase(reader as never);
    const out = await useCase.execute(
      { userId: 1, contractIds: [10] },
      'veiculo',
      {},
    );

    expect(reader.getCollectionSnapshot).toHaveBeenCalledWith('veiculo', {
      userId: 1,
      contractIds: [10],
    });
    expect(reader.getCollectionDelta).not.toHaveBeenCalled();
    expect(out).toMatchObject({ items: [{ id: 1 }] });
  });

  it('loads delta collection when mode is delta', async () => {
    const reader = {
      getCollectionDef: jest.fn().mockReturnValue({
        name: 'equipe',
        mode: 'delta',
      }),
      getCollectionSnapshot: jest.fn(),
      getCollectionDelta: jest.fn().mockResolvedValue({
        serverTime: '2026-01-01T00:00:00.000Z',
        nextSince: '2026-01-01T00:00:00.000Z',
        items: [{ id: 2 }],
        deletedIds: ['3'],
      }),
    };

    const useCase = new GetSyncCollectionUseCase(reader as never);
    const out = await useCase.execute(
      { userId: 1, contractIds: [10] },
      'equipe',
      {
        since: '2025-12-31T00:00:00.000Z',
        until: '2026-01-01T00:00:00.000Z',
      },
    );

    expect(reader.getCollectionDelta).toHaveBeenCalledWith(
      'equipe',
      { userId: 1, contractIds: [10] },
      {
        since: '2025-12-31T00:00:00.000Z',
        until: '2026-01-01T00:00:00.000Z',
      },
    );
    expect(out).toMatchObject({ deletedIds: ['3'] });
  });
});
