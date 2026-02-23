import { Module } from '@nestjs/common';
import { ContractPermissionsModule } from '../auth/modules/contract-permissions/contract-permissions.module';
import { BuildSyncManifestUseCase } from './application/use-cases/build-sync-manifest.use-case';
import { GetSyncCollectionUseCase } from './application/use-cases/get-sync-collection.use-case';
import { SYNC_READER } from './domain/ports/sync-reader.port';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [ContractPermissionsModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    BuildSyncManifestUseCase,
    GetSyncCollectionUseCase,
    { provide: SYNC_READER, useExisting: SyncService },
  ],
})
export class SyncModule {}
