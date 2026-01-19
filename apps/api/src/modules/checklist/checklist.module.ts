import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { ChecklistSyncController } from './controllers/checklist-sync.controller';
import { ChecklistController } from './controllers/checklist.controller';
import { ChecklistService } from './services/checklist.service';
import { ChecklistSyncService } from './services/checklist-sync.service';

/**
 * Módulo de Checklists
 *
 * - ChecklistController: listagem (findAll, findOne, count). Criação/edição no web.
 * - ChecklistSyncController: sincronização para mobile (checksum, incremental since).
 * - ChecklistService: listagem e contagem.
 * - ChecklistSyncService: checksum, getSyncStatus, 7 findAll*ForSync(since).
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ChecklistService, ChecklistSyncService],
  exports: [ChecklistService, ChecklistSyncService],
  controllers: [ChecklistSyncController, ChecklistController],
})
export class ChecklistModule {}
