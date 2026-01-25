import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@core/auth/auth.module';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import {
  MAX_MOBILE_PHOTO_FILE_SIZE,
  MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX,
  MOBILE_PHOTO_UPLOAD_ROOT,
} from '@common/constants/mobile-upload';
import { LocalDiskStorageAdapter } from '@common/storage/local-disk-storage.adapter';
import { STORAGE_PORT } from '@common/storage/storage.port';
import {
  MobilePhotoUploadController,
  MobileLocationUploadController,
} from './controllers';
import {
  FotoPendenciaProcessorService,
  MobilePhotoUploadService,
  MobileLocationUploadService,
} from './services';

/**
 * Módulo responsável pelos endpoints de upload do aplicativo mobile.
 */
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_MOBILE_PHOTO_FILE_SIZE,
      },
    }),
  ],
  controllers: [MobilePhotoUploadController, MobileLocationUploadController],
  providers: [
    {
      provide: STORAGE_PORT,
      useValue: new LocalDiskStorageAdapter(
        MOBILE_PHOTO_UPLOAD_ROOT,
        MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX
      ),
    },
    FotoPendenciaProcessorService,
    MobilePhotoUploadService,
    MobileLocationUploadService,
  ],
  exports: [MobilePhotoUploadService, MobileLocationUploadService],
})
export class MobileUploadModule {}
