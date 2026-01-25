/**
 * Porta de armazenamento de arquivos (storage plugável).
 * Implementações: LocalDiskStorageAdapter, futuros adapters (S3, etc.).
 */

export interface StoragePort {
  put(input: {
    key: string;
    buffer: Buffer;
    contentType?: string;
  }): Promise<{ key: string; size: number }>;

  delete(key: string): Promise<void>;

  getPublicUrl(key: string): string;
}
