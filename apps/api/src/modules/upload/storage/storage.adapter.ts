export interface StorageUploadInput {
  buffer: Buffer;
  mimeType: string;
  size: number;
  path: string;
}

export interface StorageUploadResult {
  url: string;
  path: string;
  size: number;
  mimeType?: string;
  filename?: string;
}

export interface StorageAdapter {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(path: string): Promise<void>;
}
