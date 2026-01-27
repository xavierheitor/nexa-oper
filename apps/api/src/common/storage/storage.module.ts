import { DynamicModule, Module } from '@nestjs/common';

import { LocalDiskStorageAdapter } from './local-disk-storage.adapter';
import { MediaService } from './media.service';
import { STORAGE_PORT } from './storage.port';

export interface StorageModuleOptions {
  rootPath: string;
  publicPrefix: string;
}

@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      providers: [
        {
          provide: STORAGE_PORT,
          useValue: new LocalDiskStorageAdapter(
            options.rootPath,
            options.publicPrefix
          ),
        },
        MediaService,
      ],
      exports: [STORAGE_PORT, MediaService],
    };
  }
}
