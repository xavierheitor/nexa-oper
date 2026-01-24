import { DatabaseService } from '@database/database.service';

import { MobileLocationUploadService } from './mobile-location-upload.service';
import { LocationUploadDto } from '../dto';

describe('MobileLocationUploadService', () => {
  const prismaMock = {
    mobileLocation: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const databaseServiceMock = {
    getPrisma: () => prismaMock,
  } as unknown as DatabaseService;

  const service = new MobileLocationUploadService(databaseServiceMock);

  beforeEach(() => {
    prismaMock.mobileLocation.findUnique.mockReset();
    prismaMock.mobileLocation.create.mockReset();
  });

  it('persiste uma nova localização quando assinatura for inédita', async () => {
    prismaMock.mobileLocation.findUnique.mockResolvedValue(null);
    prismaMock.mobileLocation.create.mockResolvedValue({
      id: 1,
    });

    const dto: LocationUploadDto = {
      turnoId: 10,
      latitude: -19.12,
      longitude: -43.98,
    };

    const result = await service.handleUpload(dto);

    expect(result.status).toBe('ok');
    expect(result.alreadyExisted).toBe(false);
    expect(prismaMock.mobileLocation.create).toHaveBeenCalledTimes(1);
  });

  it('retorna sucesso sem persistir quando assinatura já existir', async () => {
    prismaMock.mobileLocation.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['signature'] },
    });

    const dto: LocationUploadDto = {
      turnoId: 10,
      latitude: -19.12,
      longitude: -43.98,
    };

    const result = await service.handleUpload(dto);

    expect(result.status).toBe('ok');
    expect(result.alreadyExisted).toBe(true);
    expect(prismaMock.mobileLocation.create).toHaveBeenCalledTimes(1);
  });
});
