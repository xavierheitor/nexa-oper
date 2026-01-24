import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import {
  EquipeSyncController,
  TipoEquipeController,
  TipoEquipeSyncController,
} from './controllers';
import { EquipeSyncService } from './services/equipe-sync.service';
import { EquipeService } from './services/equipe.service';
import { TipoEquipeService } from './services/tipo-equipe.service';

/**
 * Módulo de Equipes
 *
 * - EquipeSyncController: sync (checksum, incremental since). Respeita contratos.
 * - TipoEquipeController: CRUD de tipos de equipe.
 * - TipoEquipeSyncController: sync de tipos de equipe para mobile.
 * - EquipeService, EquipeSyncService, TipoEquipeService.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    EquipeSyncController,
    TipoEquipeController,
    TipoEquipeSyncController,
  ],
  providers: [EquipeService, EquipeSyncService, TipoEquipeService],
  exports: [EquipeService, EquipeSyncService, TipoEquipeService],
})
export class EquipeModule {}
