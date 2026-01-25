import { DatabaseService } from '@database/database.service';

import { MobilePhotoUploadService } from './mobile-photo-upload.service';
import { PhotoUploadDto } from '../dto';

describe('MobilePhotoUploadService', () => {
  const prismaMock = {
    mobilePhoto: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const databaseServiceMock = {
    getPrisma: () => prismaMock,
  } as unknown as DatabaseService;

  const storageMock = {
    put: jest.fn().mockResolvedValue({ key: '1/file.jpg', size: 123 }),
    delete: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn((key: string) => '/uploads/mobile/photos/' + key),
  };

  const pendenciaProcessorMock = {
    processarSemUuid: jest.fn().mockResolvedValue(undefined),
    processarComUuid: jest.fn().mockResolvedValue(undefined),
  };

  const service = new MobilePhotoUploadService(
    databaseServiceMock,
    storageMock,
    pendenciaProcessorMock as never
  );

  const fileMock = (overrides?: Partial<Express.Multer.File>) =>
    ({
      buffer: Buffer.from('test-data'),
      mimetype: 'image/jpeg',
      originalname: 'test.jpg',
      size: 1024,
      fieldname: 'file',
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(() => {
    storageMock.put.mockClear();
    storageMock.delete.mockClear();
    storageMock.getPublicUrl.mockClear();
    prismaMock.mobilePhoto.findUnique.mockReset();
    prismaMock.mobilePhoto.create.mockReset();
  });

  it('salva uma nova foto quando não houver duplicidade', async () => {
    prismaMock.mobilePhoto.findUnique.mockResolvedValue(null);
    prismaMock.mobilePhoto.create.mockResolvedValue({
      id: 1,
      url: '/uploads/mobile/photos/1/file.jpg',
      checksum: 'checksum',
    });

    const dto: PhotoUploadDto = {
      turnoId: 1,
      tipo: 'servico',
    };

    const result = await service.handleUpload(fileMock(), dto);

    expect(result.status).toBe('stored');
    expect(result.url).toContain('/uploads/mobile/photos/1/');
    expect(prismaMock.mobilePhoto.create).toHaveBeenCalledTimes(1);
    expect(storageMock.put).toHaveBeenCalledTimes(1);
  });

  it('retorna duplicidade quando foto já existir', async () => {
    prismaMock.mobilePhoto.findUnique.mockResolvedValue({
      id: 1,
      url: '/uploads/mobile/photos/1/existing.jpg',
      checksum: 'checksum-existing',
    });

    const dto: PhotoUploadDto = {
      turnoId: 1,
      tipo: 'servico',
    };

    const result = await service.handleUpload(fileMock(), dto);

    expect(result.status).toBe('duplicate');
    expect(result.url).toBe('/uploads/mobile/photos/1/existing.jpg');
    expect(prismaMock.mobilePhoto.create).not.toHaveBeenCalled();
    expect(storageMock.put).not.toHaveBeenCalled();
  });

  it('ao lançar P2002 no create, remove arquivo (unlink) e retorna duplicate quando findUnique acha existente', async () => {
    prismaMock.mobilePhoto.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 2,
        url: '/mobile/photos/1/existing-race.jpg',
        checksum: 'checksum-race',
      });
    prismaMock.mobilePhoto.create.mockRejectedValue({ code: 'P2002' });

    const dto: PhotoUploadDto = { turnoId: 1, tipo: 'pendencia' };

    const result = await service.handleUpload(fileMock(), dto);

    expect(result.status).toBe('duplicate');
    expect(result.url).toBe('/mobile/photos/1/existing-race.jpg');
    expect(result.checksum).toBe('checksum-race');
    expect(storageMock.delete).toHaveBeenCalledTimes(1);
  });
});
