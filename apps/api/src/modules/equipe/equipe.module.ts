import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { EquipeController, EquipeSyncController } from './controllers';
import { EquipeService } from './services/equipe.service';

/**
 * Módulo de Equipes
 *
 * Centraliza todos os componentes responsáveis pela gestão
 * de equipes na API, incluindo CRUD, sincronização e
 * integração com permissões de contrato.
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EquipeSyncController, EquipeController],
  providers: [EquipeService],
  exports: [EquipeService],
})
export class EquipeModule {}
