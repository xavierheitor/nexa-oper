import { DatabaseService } from '@database/database.service';
import { MediaService } from '@common/storage';

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

  const mediaMock = {
    saveBuffer: jest.fn().mockResolvedValue({
      key: '1/file.jpg',
      absolutePath: '/uploads/mobile/photos/1/file.jpg',
      publicUrl: '/uploads/mobile/photos/1/file.jpg',
    }),
    deleteByKey: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn((key: string) => '/uploads/mobile/photos/' + key),
  };

  const pendenciaProcessorMock = {
    processarSemUuid: jest.fn().mockResolvedValue(undefined),
    processarComUuid: jest.fn().mockResolvedValue(undefined),
  };

  const service = new MobilePhotoUploadService(
    databaseServiceMock,
    mediaMock as unknown as MediaService,
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
    mediaMock.saveBuffer.mockClear();
    mediaMock.deleteByKey.mockClear();
    mediaMock.getPublicUrl.mockClear();
    pendenciaProcessorMock.processarSemUuid.mockClear();
    pendenciaProcessorMock.processarComUuid.mockClear();
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
    expect(mediaMock.saveBuffer).toHaveBeenCalledTimes(1);
    expect(mediaMock.deleteByKey).not.toHaveBeenCalled();
  });

  it('chama mediaService.saveBuffer e usa publicUrl do resultado quando upload é armazenado com sucesso', async () => {
    prismaMock.mobilePhoto.findUnique.mockResolvedValue(null);
    prismaMock.mobilePhoto.create.mockResolvedValue({
      id: 1,
      url: '/uploads/mobile/photos/1/file.jpg',
      checksum: 'checksum',
    });
    mediaMock.saveBuffer.mockResolvedValue({
      key: '1/timestamp_uuid.jpg',
      absolutePath: '/uploads/mobile/photos/1/timestamp_uuid.jpg',
      publicUrl: '/uploads/mobile/photos/1/timestamp_uuid.jpg',
    });

    const dto: PhotoUploadDto = {
      turnoId: 1,
      tipo: 'servico',
    };

    const result = await service.handleUpload(fileMock(), dto);

    expect(mediaMock.saveBuffer).toHaveBeenCalledTimes(1);
    expect(result.url).toBe('/uploads/mobile/photos/1/timestamp_uuid.jpg');
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
    expect(mediaMock.saveBuffer).not.toHaveBeenCalled();
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
    expect(mediaMock.deleteByKey).toHaveBeenCalledTimes(1);
  });

  it('quando tipo=pendencia e checklistPerguntaId existe, chama pendenciaProcessor.processarSemUuid', async () => {
    prismaMock.mobilePhoto.findUnique.mockResolvedValue(null);
    prismaMock.mobilePhoto.create.mockResolvedValue({
      id: 1,
      url: '/mobile/photos/1/foto.jpg',
      checksum: 'checksum',
    });

    const dto: PhotoUploadDto = {
      turnoId: 1,
      tipo: 'pendencia',
      checklistPerguntaId: 123,
    };

    await service.handleUpload(fileMock(), dto);

    expect(pendenciaProcessorMock.processarSemUuid).toHaveBeenCalledTimes(1);
    expect(pendenciaProcessorMock.processarSemUuid).toHaveBeenCalledWith(
      1,
      1,
      123
    );
    expect(pendenciaProcessorMock.processarComUuid).not.toHaveBeenCalled();
  });

  it('quando tipo=checklistReprova com checklistUuid e checklistPerguntaId, chama pendenciaProcessor.processarComUuid', async () => {
    prismaMock.mobilePhoto.findUnique.mockResolvedValue(null);
    prismaMock.mobilePhoto.create.mockResolvedValue({
      id: 2,
      url: '/mobile/photos/1/foto.jpg',
      checksum: 'checksum',
    });

    const dto: PhotoUploadDto = {
      turnoId: 1,
      tipo: 'checklistReprova',
      checklistUuid: 'abc-123',
      checklistPerguntaId: 456,
    };

    await service.handleUpload(fileMock(), dto);

    expect(pendenciaProcessorMock.processarComUuid).toHaveBeenCalledTimes(1);
    expect(pendenciaProcessorMock.processarComUuid).toHaveBeenCalledWith(
      2,
      1,
      'abc-123',
      456
    );
    expect(pendenciaProcessorMock.processarSemUuid).not.toHaveBeenCalled();
  });
});
