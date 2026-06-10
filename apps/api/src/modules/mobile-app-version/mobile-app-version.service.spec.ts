import { MobileAppVersionService } from './mobile-app-version.service';

describe('MobileAppVersionService', () => {
  const storage = {
    upload: jest.fn(),
    delete: jest.fn(),
  };

  function makeService(findFirst: jest.Mock) {
    const prisma = {
      mobileAppVersion: {
        findFirst,
      },
    };

    return new MobileAppVersionService(prisma as never, storage);
  }

  it('returns manifest for active android version', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      versao: '1.2.0',
      build: 120,
      arquivoUrl: '/uploads/apk/nexa-1.2.0.apk',
      minSupportedBuild: 112,
      wipeRequired: true,
      notas: 'Correcoes de estabilidade',
      apkSizeBytes: 42_000_000,
      sha256: 'a'.repeat(64),
      minLoginBuild: 110,
      minOpenTurnoBuild: 115,
      minUploadBuild: 118,
    });
    const service = makeService(findFirst);

    await expect(service.getManifest('android')).resolves.toEqual({
      latest: '1.2.0',
      build: 120,
      apkUrl: '/uploads/apk/nexa-1.2.0.apk',
      minSupported: 112,
      wipeRequired: true,
      notes: 'Correcoes de estabilidade',
      apkSizeBytes: 42_000_000,
      sha256: 'a'.repeat(64),
      policy: {
        minLoginBuild: 110,
        minOpenTurnoBuild: 115,
        minUploadBuild: 118,
      },
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { plataforma: 'android', ativo: true },
      orderBy: { build: 'desc' },
    });
  });

  it('normalizes unknown platform to android', async () => {
    const findFirst = jest.fn().mockResolvedValue({
      versao: '1.2.0',
      build: 120,
      arquivoUrl: '/uploads/apk/nexa-1.2.0.apk',
      minSupportedBuild: null,
      wipeRequired: false,
      notas: null,
      apkSizeBytes: null,
      sha256: null,
      minLoginBuild: null,
      minOpenTurnoBuild: null,
      minUploadBuild: null,
    });
    const service = makeService(findFirst);

    await service.getManifest('windows');

    expect(findFirst).toHaveBeenCalledWith({
      where: { plataforma: 'android', ativo: true },
      orderBy: { build: 'desc' },
    });
  });

  it('throws not found when there is no active version', async () => {
    const service = makeService(jest.fn().mockResolvedValue(null));

    await expect(service.getManifest('ios')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});
