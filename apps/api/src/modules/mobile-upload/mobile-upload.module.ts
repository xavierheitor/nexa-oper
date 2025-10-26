import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import {
  MobilePhotoUploadController,
  MobileLocationUploadController,
} from './controllers';
import {
  MobilePhotoUploadService,
  MobileLocationUploadService,
} from './services';
import { MAX_MOBILE_PHOTO_FILE_SIZE } from './constants/mobile-upload.constants';

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
  providers: [MobilePhotoUploadService, MobileLocationUploadService],
  exports: [MobilePhotoUploadService, MobileLocationUploadService],
})
export class MobileUploadModule {}
