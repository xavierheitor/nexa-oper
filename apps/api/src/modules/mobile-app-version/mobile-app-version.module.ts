import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { UploadModule } from '../upload/upload.module';
import { MobileAppVersionService } from './mobile-app-version.service';
import { MobileAppVersionController } from './mobile-app-version.controller';
import { MobileAppVersionPublicController } from './mobile-app-version-public.controller';

@Module({
  imports: [DatabaseModule, UploadModule],
  controllers: [MobileAppVersionController, MobileAppVersionPublicController],
  providers: [MobileAppVersionService],
  exports: [MobileAppVersionService],
})
export class MobileAppVersionModule {}
