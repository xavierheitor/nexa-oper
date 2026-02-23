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

  it('returns existing upload and skips storage write when handler finds duplicate', async () => {
    const storage = {
      upload: jest.fn(),
      delete: jest.fn(),
    };

    const existing = {
      path: 'checklists/1/reprovas/foto.jpg',
      size: 10,
      url: '/uploads/checklists/1/reprovas/foto.jpg',
      mimeType: 'image/jpeg',
    };

    const handler = {
      validate: jest.fn().mockResolvedValue(undefined),
      findExisting: jest.fn().mockResolvedValue(existing),
      buildStoragePath: jest.fn(),
      persist: jest.fn(),
    };

    const registry = {
      get: jest.fn().mockReturnValue(handler),
    };

    const logger = {
      debug: jest.fn(),
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
    ).resolves.toMatchObject(existing);

    expect(storage.upload).not.toHaveBeenCalled();
    expect(handler.persist).not.toHaveBeenCalled();
  });

  it('removes duplicate file when handler returns canonical persisted path', async () => {
    const storage = {
      upload: jest.fn().mockResolvedValue({
        path: 'checklists/1/reprovas/foto-new.jpg',
        size: 10,
        url: '/uploads/checklists/1/reprovas/foto-new.jpg',
        mimeType: 'image/jpeg',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const handler = {
      validate: jest.fn().mockResolvedValue(undefined),
      findExisting: jest.fn().mockResolvedValue(null),
      buildStoragePath: jest
        .fn()
        .mockReturnValue('checklists/1/reprovas/foto-new.jpg'),
      persist: jest.fn().mockResolvedValue({
        path: 'checklists/1/reprovas/foto.jpg',
        size: 10,
        url: '/uploads/checklists/1/reprovas/foto.jpg',
        mimeType: 'image/jpeg',
      }),
    };

    const registry = {
      get: jest.fn().mockReturnValue(handler),
    };

    const logger = {
      debug: jest.fn(),
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

    expect(storage.delete).toHaveBeenCalledWith(
      'checklists/1/reprovas/foto-new.jpg',
    );
  });
});
