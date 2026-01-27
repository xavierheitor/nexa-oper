import { join } from 'path';

import { STORAGE_PORT, type StoragePort } from './storage.port';
import { MediaService } from './media.service';

describe('MediaService', () => {
  const storageMock = {
    put: jest.fn().mockResolvedValue({ key: '10/123/a.jpg', size: 1024 }),
    delete: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn().mockReturnValue('/uploads/10/123/a.jpg'),
  } as unknown as StoragePort;

  const mediaService = new MediaService(storageMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBuffer', () => {
    it('chama storage.put com key/buffer/contentType e retorna absolutePath e publicUrl corretos', async () => {
      const buffer = Buffer.from('test-data');
      const contentType = 'image/jpeg';
      const rootPath = '/tmp/uploads';
      const key = '10/123/a.jpg';

      const result = await mediaService.saveBuffer({
        key,
        buffer,
        contentType,
        rootPath,
      });

      expect(storageMock.put).toHaveBeenCalledTimes(1);
      expect(storageMock.put).toHaveBeenCalledWith({
        key,
        buffer,
        contentType,
      });

      expect(result.key).toBe(key);
      expect(result.absolutePath).toBe(join(rootPath, '10', '123', 'a.jpg'));
      expect(storageMock.getPublicUrl).toHaveBeenCalledTimes(1);
      expect(storageMock.getPublicUrl).toHaveBeenCalledWith(key);
      expect(result.publicUrl).toBe('/uploads/10/123/a.jpg');
    });
  });

  describe('deleteByKey', () => {
    it('chama storage.delete com a key', async () => {
      const key = '10/123/a.jpg';

      await mediaService.deleteByKey(key);

      expect(storageMock.delete).toHaveBeenCalledTimes(1);
      expect(storageMock.delete).toHaveBeenCalledWith(key);
    });
  });

  describe('getPublicUrl', () => {
    it('retorna o valor de storage.getPublicUrl', () => {
      const key = '10/123/a.jpg';
      const getPublicUrlMock = storageMock.getPublicUrl as jest.MockedFunction<
        (key: string) => string
      >;
      getPublicUrlMock.mockReturnValue('/uploads/10/123/a.jpg');

      const result = mediaService.getPublicUrl(key);

      expect(getPublicUrlMock).toHaveBeenCalledTimes(1);
      expect(getPublicUrlMock).toHaveBeenCalledWith(key);
      expect(result).toBe('/uploads/10/123/a.jpg');
    });
  });
});
