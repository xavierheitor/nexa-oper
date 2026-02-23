import { SyncTurnosUseCase } from './sync-turnos.use-case';

describe('SyncTurnosUseCase', () => {
  it('delegates sync query to repository port', async () => {
    const repo = {
      findTurnosForSync: jest.fn().mockResolvedValue([{ id: 1 }]),
    };

    const useCase = new SyncTurnosUseCase(repo as never);
    const since = new Date('2026-01-01T00:00:00.000Z');

    await expect(useCase.execute({ since, limit: 50 })).resolves.toHaveLength(
      1,
    );
    expect(repo.findTurnosForSync).toHaveBeenCalledWith(since, 50);
  });
});
