import { AppError } from '../../core/errors/app-error';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  it('removes uploaded file when handler persist fails', async () => {
    const storage = {
      upload: jest.fn().mockResolvedValue({
        path: 'checklists/1/reprovas/foto.jpg',
        size: 10,
        url: '/uploads/checklists/1/reprovas/foto.jpg',
        mimeType: 'image/jpeg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const handler = {
      validate: jest.fn().mockResolvedValue(undefined),
      buildStoragePath: jest
        .fn()
        .mockReturnValue('checklists/1/reprovas/foto.jpg'),
      persist: jest.fn().mockRejectedValue(AppError.internal('persist error')),
    };

    const registry = {
      get: jest.fn().mockReturnValue(handler),
    };

    const logger = {
      error: jest.fn(),
    };

    const service = new UploadService(
      storage as never,
      registry as never,
      logger as never,
    );

    await expect(
      service.upload(
        {
          buffer: Buffer.from('abc'),
          mimetype: 'image/jpeg',
          size: 10,
          originalname: 'foto.jpg',
        },
        {
          type: 'checklist-reprova',
          entityId: '1',
        },
      ),
    ).rejects.toBeInstanceOf(AppError);

    expect(storage.delete).toHaveBeenCalledWith(
      'checklists/1/reprovas/foto.jpg',
    );
  });

  it('does not remove file when persist succeeds', async () => {
    const storage = {
      upload: jest.fn().mockResolvedValue({
        path: 'checklists/1/reprovas/foto.jpg',
        size: 10,
        url: '/uploads/checklists/1/reprovas/foto.jpg',
        mimeType: 'image/jpeg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const handler = {
      validate: jest.fn().mockResolvedValue(undefined),
      buildStoragePath: jest
        .fn()
        .mockReturnValue('checklists/1/reprovas/foto.jpg'),
      persist: jest.fn().mockResolvedValue(undefined),
    };

    const registry = {
      get: jest.fn().mockReturnValue(handler),
    };

    const logger = {
      error: jest.fn(),
    };

    const service = new UploadService(
      storage as never,
      registry as never,
      logger as never,
    );

    await expect(
      service.upload(
        {
          buffer: Buffer.from('abc'),
          mimetype: 'image/jpeg',
          size: 10,
          originalname: 'foto.jpg',
        },
        {
          type: 'checklist-reprova',
          entityId: '1',
        },
      ),
    ).resolves.toMatchObject({
      path: 'checklists/1/reprovas/foto.jpg',
    });

    expect(storage.delete).not.toHaveBeenCalled();
  });
});
