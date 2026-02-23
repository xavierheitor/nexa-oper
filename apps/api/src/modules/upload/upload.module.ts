import { Inject, Module } from '@nestjs/common';
import { LoggerModule } from '../../core/logger/logger.module';
import { DatabaseModule } from '../../database';
import type { EvidenceHandler } from './evidence/evidence.handler';
import { ListUploadTypesUseCase } from './application/use-cases/list-upload-types.use-case';
import { UploadEvidenceUseCase } from './application/use-cases/upload-evidence.use-case';
import { UPLOAD_PROCESSOR } from './domain/ports/upload-processor.port';
import { AprEvidenceHandler } from './evidence/apr-evidence.handler';
import { AtividadeTurnoEvidenceHandler } from './evidence/atividade-turno.handler';
import { ChecklistAssinaturaEvidenceHandler } from './evidence/checklist-assinatura.handler';
import { ChecklistReprovaEvidenceHandler } from './evidence/checklist-reprova.handler';
import { MedidorEvidenceHandler } from './evidence/medidor.handler';
import { StorageFactory } from './storage/storage.factory';
import { UploadController } from './upload.controller';
import { UploadRegistry } from './upload.registry';
import { UploadService } from './upload.service';

const EVIDENCE_HANDLERS = [
  ChecklistReprovaEvidenceHandler,
  ChecklistAssinaturaEvidenceHandler,
  AprEvidenceHandler,
  AtividadeTurnoEvidenceHandler,
  MedidorEvidenceHandler,
] as const;

@Module({
  imports: [LoggerModule, DatabaseModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    UploadEvidenceUseCase,
    ListUploadTypesUseCase,
    UploadRegistry,
    StorageFactory,
    ...EVIDENCE_HANDLERS,
    { provide: UPLOAD_PROCESSOR, useExisting: UploadService },
    {
      provide: 'STORAGE_ADAPTER',
      useFactory: (factory: StorageFactory) => factory.create(),
      inject: [StorageFactory],
    },
    {
      provide: 'EVIDENCE_HANDLERS',
      useFactory: (...handlers: EvidenceHandler[]) => handlers,
      inject: [...EVIDENCE_HANDLERS],
    },
  ],
  exports: [UploadService],
})
export class UploadModule {
  constructor(
    private readonly registry: UploadRegistry,
    @Inject('EVIDENCE_HANDLERS') handlers: EvidenceHandler[],
  ) {
    handlers.forEach((h) => this.registry.register(h));
  }
}
