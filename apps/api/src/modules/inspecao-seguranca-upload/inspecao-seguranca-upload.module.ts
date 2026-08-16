import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger/logger.module';
import { DatabaseModule } from '../../database';
import { StorageFactory } from '../upload/storage/storage.factory';
import { InspecaoSegurancaUploadController } from './inspecao-seguranca-upload.controller';
import {
  INSPECAO_SEGURANCA_UPLOAD_STORAGE,
  InspecaoSegurancaUploadService,
} from './inspecao-seguranca-upload.service';

@Module({
  imports: [LoggerModule, DatabaseModule],
  controllers: [InspecaoSegurancaUploadController],
  providers: [
    InspecaoSegurancaUploadService,
    StorageFactory,
    {
      provide: INSPECAO_SEGURANCA_UPLOAD_STORAGE,
      useFactory: (factory: StorageFactory) => factory.create(),
      inject: [StorageFactory],
    },
  ],
})
export class InspecaoSegurancaUploadModule {}
