import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { TipoEquipeController, TipoEquipeSyncController } from './controllers';
import { TipoEquipeService } from './services/tipo-equipe.service';

/**
 * Módulo de Tipos de Equipe
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos tipos de equipe, incluindo CRUD e sincronização.
 *
 * CONTROLLERS:
 * - TipoEquipeController: Operações CRUD (listagem paginada, criação, atualização, exclusão)
 * - TipoEquipeSyncController: Sincronização para clientes mobile
 *
 * SERVICES:
 * - TipoEquipeService: Lógica de negócio centralizada
 *
 * IMPORTS:
 * - DatabaseModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [TipoEquipeService],
  exports: [TipoEquipeService],
  controllers: [TipoEquipeSyncController, TipoEquipeController],
})
export class TipoEquipeModule {}
