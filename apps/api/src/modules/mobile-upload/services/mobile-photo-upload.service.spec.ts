jest.mock('fs/promises', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
}));

import * as fsPromises from 'fs/promises';

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

  const service = new MobilePhotoUploadService(databaseServiceMock);

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
    (fsPromises.mkdir as jest.Mock).mockClear();
    (fsPromises.unlink as jest.Mock).mockClear();
    (fsPromises.writeFile as jest.Mock).mockClear();
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
    expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
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
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
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
    expect(fsPromises.unlink).toHaveBeenCalledTimes(1);
  });
});
