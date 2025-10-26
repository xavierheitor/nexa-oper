/**
 * Arquivo de índice principal do módulo de uploads mobile.
 */

export { MobileUploadModule } from './mobile-upload.module';

export {
  MobilePhotoUploadController,
  MobileLocationUploadController,
} from './controllers';

export {
  MobilePhotoUploadService,
  MobileLocationUploadService,
} from './services';

export {
  PhotoUploadDto,
  PhotoUploadResponseDto,
  LocationUploadDto,
  LocationUploadResponseDto,
} from './dto';

export {
  MAX_MOBILE_PHOTO_FILE_SIZE,
  ALLOWED_MOBILE_PHOTO_MIME_TYPES,
  SUPPORTED_MOBILE_PHOTO_TYPES,
  MOBILE_PHOTO_UPLOAD_ROOT,
  MOBILE_PHOTO_UPLOAD_PUBLIC_PREFIX,
} from './constants/mobile-upload.constants';
