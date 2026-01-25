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
import { StorageModule } from '@common/storage/storage.module';
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
    StorageModule.forRoot({
      rootPath: MOBILE_PHOTO_UPLOAD_ROOT,
      publicPrefix: MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX,
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_MOBILE_PHOTO_FILE_SIZE,
      },
    }),
  ],
  controllers: [MobilePhotoUploadController, MobileLocationUploadController],
  providers: [
    FotoPendenciaProcessorService,
    MobilePhotoUploadService,
    MobileLocationUploadService,
  ],
  exports: [MobilePhotoUploadService, MobileLocationUploadService],
})
export class MobileUploadModule {}
