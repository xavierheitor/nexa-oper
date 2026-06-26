import { Inject, Module } from '@nestjs/common';

import { LoggerModule } from '../../core/logger/logger.module';
import { DatabaseModule } from '../../database';

import { ListUploadTypesUseCase } from './application/use-cases/list-upload-types.use-case';
import { UploadEvidenceUseCase } from './application/use-cases/upload-evidence.use-case';
import { UPLOAD_PROCESSOR } from './domain/ports/upload-processor.port';
import { AprEvidenceHandler } from './evidence/apr-evidence.handler';
import { AtividadeTurnoEvidenceHandler } from './evidence/atividade-turno.handler';
import { ChecklistAssinaturaEvidenceHandler } from './evidence/checklist-assinatura.handler';
import { ChecklistReprovaEvidenceHandler } from './evidence/checklist-reprova.handler';
import type { EvidenceHandler } from './evidence/evidence.handler';
import { MedidorEvidenceHandler } from './evidence/medidor.handler';
import { ProjetoViabilizacaoPosteEvidenceHandler } from './evidence/projeto-viabilizacao-poste.handler';
import { UploadEvidenceLinkService } from './evidence/upload-evidence-link.service';
import { ChecklistPhotoReconcileJob } from './jobs/checklist-photo-reconcile.job';
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
  ProjetoViabilizacaoPosteEvidenceHandler,
] as const;

@Module({
  imports: [LoggerModule, DatabaseModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    UploadEvidenceUseCase,
    ListUploadTypesUseCase,
    UploadRegistry,
    UploadEvidenceLinkService,
    ChecklistPhotoReconcileJob,
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
  exports: [UploadService, 'STORAGE_ADAPTER'],
})
export class UploadModule {
  constructor(
    private readonly registry: UploadRegistry,
    @Inject('EVIDENCE_HANDLERS') handlers: EvidenceHandler[],
  ) {
    handlers.forEach((h) => this.registry.register(h));
  }
}
