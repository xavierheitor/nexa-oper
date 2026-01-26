import { join } from 'path';

import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';

import { ChecklistFotoService } from './checklist-foto.service';

describe('ChecklistFotoService', () => {
  const prismaMock = {
    checklistResposta: {
      findUnique: jest.fn(),
    },
  };

  const databaseServiceMock = {
    getPrisma: () => prismaMock,
  } as unknown as DatabaseService;

  const storageMock = {
    put: jest.fn().mockResolvedValue({ key: '10/123/file.jpg', size: 1 }),
    delete: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn(),
  };

  const service = new ChecklistFotoService(databaseServiceMock, storageMock);

  beforeEach(() => {
    prismaMock.checklistResposta.findUnique.mockReset();
    storageMock.put.mockClear();
    storageMock.getPublicUrl.mockClear();
  });

  describe('salvarArquivo', () => {
    it('chama storage.put com key 10/123/..., buffer e contentType e retorna path contendo /checklists/10/123/', async () => {
      prismaMock.checklistResposta.findUnique.mockResolvedValue({
        checklistPreenchido: { turnoId: 10 },
      });
      storageMock.put.mockResolvedValue({ key: '10/123/x.jpg', size: 10 });

      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
      };

      const path = await service.salvarArquivo(file, 123);

      expect(storageMock.put).toHaveBeenCalledTimes(1);
      expect(storageMock.put).toHaveBeenCalledWith(
        expect.objectContaining({
          key: expect.stringMatching(/^10\/123\//),
          buffer: file.buffer,
          contentType: 'image/jpeg',
        })
      );
      expect(path).toContain('/checklists/10/123/');
    });

    it('lança BadRequestException quando storage.put rejeita', async () => {
      prismaMock.checklistResposta.findUnique.mockResolvedValue({
        checklistPreenchido: { turnoId: 10 },
      });
      storageMock.put.mockRejectedValue(new Error('fail'));

      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
      };

      await expect(service.salvarArquivo(file, 123)).rejects.toThrow(
        new BadRequestException('Erro ao salvar arquivo')
      );
    });
  });

  describe('gerarUrlPublica', () => {
    it('chama storage.getPublicUrl com 10/123/file.jpg e retorna o valor retornado pelo storage', () => {
      storageMock.getPublicUrl.mockReturnValue('public-url');

      const caminho = join(
        process.cwd(),
        'uploads',
        'checklists',
        '10',
        '123',
        'file.jpg'
      );
      const result = service.gerarUrlPublica(caminho);

      expect(storageMock.getPublicUrl).toHaveBeenCalledWith('10/123/file.jpg');
      expect(result).toBe('public-url');
    });
  });
});
