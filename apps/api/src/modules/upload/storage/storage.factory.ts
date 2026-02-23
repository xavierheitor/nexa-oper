import { Injectable } from '@nestjs/common';
import { env } from '../../../core/config/env';
import type { StorageAdapter } from './storage.adapter';
import { LocalStorageAdapter } from './local-storage.adapter';
import { S3StorageAdapter } from './s3-storage.adapter';

@Injectable()
export class StorageFactory {
  create(): StorageAdapter {
    const storage = env.UPLOAD_STORAGE;
    switch (storage) {
      case 's3':
        return new S3StorageAdapter();
      case 'local':
      default:
        return new LocalStorageAdapter();
    }
  }
}
