import { DatabaseService } from '@database/database.service';

import { FotoPendenciaProcessorService } from './foto-pendencia-processor.service';

describe('FotoPendenciaProcessorService', () => {
  const prismaMock = {
    mobilePhoto: { findUnique: jest.fn() },
    checklistResposta: { findMany: jest.fn() },
    checklistRespostaFoto: { create: jest.fn() },
  };

  const databaseServiceMock = {
    getPrisma: () => prismaMock,
  } as unknown as DatabaseService;

  const service = new FotoPendenciaProcessorService(databaseServiceMock);

  beforeEach(() => {
    prismaMock.mobilePhoto.findUnique.mockReset();
    prismaMock.checklistResposta.findMany.mockReset();
    prismaMock.checklistRespostaFoto.create.mockReset();
  });

  describe('processarSemUuid', () => {
    it('quando mobilePhoto não existe, não chama checklistResposta.findMany', async () => {
      prismaMock.mobilePhoto.findUnique.mockResolvedValue(null);

      await service.processarSemUuid(1, 10, 100);

      expect(prismaMock.mobilePhoto.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prismaMock.checklistResposta.findMany).not.toHaveBeenCalled();
    });

    it('quando findMany retorna vazio, não chama checklistRespostaFoto.create', async () => {
      prismaMock.mobilePhoto.findUnique.mockResolvedValue({
        id: 1,
        storagePath: '/x',
        url: '/x',
        fileSize: 1,
        mimeType: 'image/jpeg',
        tipo: 'pendencia',
        capturedAt: null,
      });
      prismaMock.checklistResposta.findMany.mockResolvedValue([]);

      await service.processarSemUuid(1, 10, 100);

      expect(prismaMock.checklistResposta.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.checklistRespostaFoto.create).not.toHaveBeenCalled();
    });
  });
});
