import { BuildSyncManifestUseCase } from './build-sync-manifest.use-case';

describe('BuildSyncManifestUseCase', () => {
  it('returns 304 when etag matches if-none-match', async () => {
    const reader = {
      buildManifest: jest.fn().mockResolvedValue({
        etag: '"abc123"',
        manifest: {
          serverTime: '2026-01-01T00:00:00.000Z',
          scopeHash: 'hash',
          collections: {},
        },
      }),
    };

    const useCase = new BuildSyncManifestUseCase(reader as never);

    await expect(
      useCase.execute({ userId: 1, contractIds: [10] }, '"abc123"'),
    ).resolves.toEqual({ statusCode: 304 });
  });

  it('returns manifest payload when etag differs', async () => {
    const reader = {
      buildManifest: jest.fn().mockResolvedValue({
        etag: '"abc123"',
        manifest: {
          serverTime: '2026-01-01T00:00:00.000Z',
          scopeHash: 'hash',
          collections: {},
        },
      }),
    };

    const useCase = new BuildSyncManifestUseCase(reader as never);

    await expect(
      useCase.execute({ userId: 1, contractIds: [10] }, '"zzz"'),
    ).resolves.toMatchObject({
      statusCode: 200,
      etag: '"abc123"',
    });
  });
});
