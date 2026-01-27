import { BadRequestException } from '@nestjs/common';

import { validateFileOrThrow } from './upload-validation';

describe('validateFileOrThrow', () => {
  const createFileMock = (overrides?: Partial<Express.Multer.File>) =>
    ({
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      originalname: 'test.jpg',
      size: 1024,
      fieldname: 'file',
      ...overrides,
    }) as Express.Multer.File;

  const validParams = {
    maxSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    invalidTypeMessage: 'Tipo de arquivo não permitido',
    sizeExceededMessage: 'Arquivo muito grande',
  };

  it('não lança quando arquivo válido', () => {
    const file = createFileMock({
      mimetype: 'image/jpeg',
      size: 1024,
    });

    expect(() => {
      validateFileOrThrow({
        file,
        ...validParams,
      });
    }).not.toThrow();
  });

  it('lança BadRequestException quando MIME não permitido', () => {
    const file = createFileMock({
      mimetype: 'application/pdf',
      size: 1024,
    });

    expect(() => {
      validateFileOrThrow({
        file,
        ...validParams,
      });
    }).toThrow(new BadRequestException('Tipo de arquivo não permitido'));
  });

  it('lança BadRequestException quando tamanho excede o máximo', () => {
    const file = createFileMock({
      mimetype: 'image/jpeg',
      size: 11 * 1024 * 1024, // 11MB, maior que o máximo de 10MB
    });

    expect(() => {
      validateFileOrThrow({
        file,
        ...validParams,
      });
    }).toThrow(new BadRequestException('Arquivo muito grande'));
  });
});
