import { mkdir, writeFile, unlink } from 'fs/promises';
import { dirname, join } from 'path';

import { StoragePort } from './storage.port';

/**
 * Adapter de storage que grava em disco local.
 * put: grava em ${rootPath}/${key}, criando diretórios com mkdir recursive.
 * delete: best effort, não lança se o arquivo não existir.
 * getPublicUrl: monta URL com publicPrefix (evita barras duplicadas).
 */
export class LocalDiskStorageAdapter implements StoragePort {
  constructor(
    private readonly rootPath: string,
    private readonly publicPrefix: string
  ) {}

  async put(input: {
    key: string;
    buffer: Buffer;
    contentType?: string;
  }): Promise<{ key: string; size: number }> {
    const fullPath = join(this.rootPath, input.key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.buffer);
    return { key: input.key, size: input.buffer.length };
  }

  async delete(key: string): Promise<void> {
    const fullPath = join(this.rootPath, key);
    try {
      await unlink(fullPath);
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') throw e;
    }
  }

  getPublicUrl(key: string): string {
    const a = this.publicPrefix.replace(/\/+$/, '');
    const b = key.replace(/^\/+/, '');
    return a ? `${a}/${b}` : b || '/';
  }
}
