import { LocalDiskStorageAdapter } from './local-disk-storage.adapter';
import { STORAGE_PORT } from './storage.port';
import { StorageModule } from './storage.module';

describe('StorageModule', () => {
  describe('forRoot', () => {
    it('retorna DynamicModule com provider STORAGE_PORT e export', () => {
      const mod = StorageModule.forRoot({
        rootPath: '/tmp',
        publicPrefix: '/uploads',
      });

      expect(mod.providers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            provide: STORAGE_PORT,
            useValue: expect.any(LocalDiskStorageAdapter),
          }),
        ])
      );
      expect(mod.exports).toContain(STORAGE_PORT);
      expect(mod.module).toBe(StorageModule);
    });
  });
});
