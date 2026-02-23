import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger/logger.module';
import { DatabaseModule } from '../../database';
import { StorageFactory } from '../upload/storage/storage.factory';
import { UploadAtividadeUseCase } from './application/use-cases/upload-atividade.use-case';
import { AtividadeUploadController } from './atividade-upload.controller';
import {
  ATIVIDADE_UPLOAD_STORAGE,
  AtividadeUploadService,
} from './atividade-upload.service';
import { ATIVIDADE_UPLOAD_REPOSITORY } from './domain/ports/atividade-upload-repository.port';

@Module({
  imports: [LoggerModule, DatabaseModule],
  controllers: [AtividadeUploadController],
  providers: [
    AtividadeUploadService,
    UploadAtividadeUseCase,
    StorageFactory,
    {
      provide: ATIVIDADE_UPLOAD_REPOSITORY,
      useExisting: AtividadeUploadService,
    },
    {
      provide: ATIVIDADE_UPLOAD_STORAGE,
      useFactory: (factory: StorageFactory) => factory.create(),
      inject: [StorageFactory],
    },
  ],
})
export class AtividadeUploadModule {}
