import { join } from 'path';

import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import { MediaService } from '@common/storage';
import { CHECKLIST_UPLOAD_ROOT } from '@common/constants/checklist-upload';

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

  const mediaMock = {
    saveBuffer: jest.fn().mockResolvedValue({
      key: '10/123/file.jpg',
      absolutePath: join(CHECKLIST_UPLOAD_ROOT, '10', '123', 'file.jpg'),
      publicUrl: '/uploads/checklists/10/123/file.jpg',
    }),
    deleteByKey: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn().mockReturnValue('public-url'),
  };

  const service = new ChecklistFotoService(
    databaseServiceMock,
    mediaMock as unknown as MediaService
  );

  beforeEach(() => {
    prismaMock.checklistResposta.findUnique.mockReset();
    mediaMock.saveBuffer.mockClear();
    mediaMock.getPublicUrl.mockClear();
  });

  describe('salvarArquivo', () => {
    it('chama mediaService.saveBuffer com key 10/123/..., buffer, contentType e rootPath e retorna absolutePath contendo /checklists/10/123/', async () => {
      prismaMock.checklistResposta.findUnique.mockResolvedValue({
        checklistPreenchido: { turnoId: 10 },
      });
      mediaMock.saveBuffer.mockResolvedValue({
        key: '10/123/x.jpg',
        absolutePath: join(CHECKLIST_UPLOAD_ROOT, '10', '123', 'x.jpg'),
        publicUrl: '/uploads/checklists/10/123/x.jpg',
      });

      const file = {
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
        originalname: 'foto.jpg',
      };

      const path = await service.salvarArquivo(file, 123);

      expect(mediaMock.saveBuffer).toHaveBeenCalledTimes(1);
      expect(mediaMock.saveBuffer).toHaveBeenCalledWith({
        key: expect.stringMatching(/^10\/123\//),
        buffer: file.buffer,
        contentType: 'image/jpeg',
        rootPath: CHECKLIST_UPLOAD_ROOT,
      });
      expect(path).toContain('/checklists/10/123/');
    });

    it('lança BadRequestException quando mediaService.saveBuffer rejeita', async () => {
      prismaMock.checklistResposta.findUnique.mockResolvedValue({
        checklistPreenchido: { turnoId: 10 },
      });
      mediaMock.saveBuffer.mockRejectedValue(new Error('fail'));

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
    it('chama mediaService.getPublicUrl com 10/123/file.jpg e retorna o valor retornado pelo mediaService', () => {
      mediaMock.getPublicUrl.mockReturnValue('public-url');

      const caminho = join(
        CHECKLIST_UPLOAD_ROOT,
        '10',
        '123',
        'file.jpg'
      );
      const result = service.gerarUrlPublica(caminho);

      expect(mediaMock.getPublicUrl).toHaveBeenCalledWith('10/123/file.jpg');
      expect(result).toBe('public-url');
    });
  });
});
