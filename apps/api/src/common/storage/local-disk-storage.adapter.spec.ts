jest.mock('fs/promises', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));

import * as fsPromises from 'fs/promises';
import { dirname, join } from 'path';

import { LocalDiskStorageAdapter } from './local-disk-storage.adapter';

describe('LocalDiskStorageAdapter', () => {
  const rootPath = '/tmp/root';
  const adapter = new LocalDiskStorageAdapter(rootPath, 'https://cdn.exemplo.com/');

  beforeEach(() => {
    jest.mocked(fsPromises.mkdir).mockClear();
    jest.mocked(fsPromises.writeFile).mockClear();
    jest.mocked(fsPromises.unlink).mockClear();
  });

  describe('put', () => {
    it('chama mkdir com recursive: true, writeFile com buffer e retorna { key, size }', async () => {
      const key = 'a/b.jpg';
      const buffer = Buffer.from('conteudo');
      const result = await adapter.put({
        key,
        buffer,
        contentType: 'image/jpeg',
      });

      const fullPath = join(rootPath, key);
      expect(fsPromises.mkdir).toHaveBeenCalledTimes(1);
      expect(fsPromises.mkdir).toHaveBeenCalledWith(dirname(fullPath), {
        recursive: true,
      });

      expect(fsPromises.writeFile).toHaveBeenCalledTimes(1);
      expect(fsPromises.writeFile).toHaveBeenCalledWith(fullPath, buffer);

      expect(result).toEqual({ key: 'a/b.jpg', size: 8 });
    });
  });

  describe('delete', () => {
    it('não lança quando unlink rejeita com ENOENT', async () => {
      jest.mocked(fsPromises.unlink).mockRejectedValueOnce({ code: 'ENOENT' });

      await expect(adapter.delete('x/y.z')).resolves.toBeUndefined();
    });

    it('lança quando unlink rejeita com código diferente de ENOENT (ex: EACCES)', async () => {
      jest.mocked(fsPromises.unlink).mockRejectedValueOnce({ code: 'EACCES' });

      await expect(adapter.delete('x/y.z')).rejects.toEqual({ code: 'EACCES' });
    });
  });

  describe('getPublicUrl', () => {
    it('prefixo https://cdn.exemplo.com/ e key /a/b.jpg → https://cdn.exemplo.com/a/b.jpg', () => {
      const url = adapter.getPublicUrl('/a/b.jpg');
      expect(url).toBe('https://cdn.exemplo.com/a/b.jpg');
    });

    it('publicPrefix vazio e key a/b.jpg → a/b.jpg (sem barra extra)', () => {
      const adapterSemPrefixo = new LocalDiskStorageAdapter('/tmp', '');
      expect(adapterSemPrefixo.getPublicUrl('a/b.jpg')).toBe('a/b.jpg');
    });
  });
});
