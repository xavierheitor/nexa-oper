import { Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger/logger.module';
import { DatabaseModule } from '../../database';
import { LocalizacaoController } from './localizacao.controller';
import { LocalizacaoService } from './localizacao.service';
import { UploadLocationUseCase } from './application/use-cases/upload-location.use-case';
import { LOCATION_UPLOAD_REPOSITORY } from './domain/ports/location-upload-repository.port';

/**
 * Módulo responsável pelo upload de localizações enviadas pelo aplicativo mobile.
 */
@Module({
  imports: [LoggerModule, DatabaseModule],
  controllers: [LocalizacaoController],
  providers: [
    LocalizacaoService,
    UploadLocationUseCase,
    { provide: LOCATION_UPLOAD_REPOSITORY, useExisting: LocalizacaoService },
  ],
  exports: [LocalizacaoService],
})
export class LocalizacaoModule {}
