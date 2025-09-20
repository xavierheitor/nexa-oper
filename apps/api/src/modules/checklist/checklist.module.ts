import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { ChecklistController } from './controllers/checklist.controller';
import { ChecklistSyncController } from './controllers/checklist-sync.controller';
import { ChecklistService } from './services/checklist.service';

/**
 * Módulo de Checklists
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos checklists de segurança, incluindo CRUD e sincronização.
 *
 * CONTROLLERS:
 * - ChecklistController: Operações CRUD (listagem paginada, criação, atualização, exclusão)
 * - ChecklistSyncController: Sincronização para clientes mobile
 *
 * SERVICES:
 * - ChecklistService: Lógica de negócio centralizada
 *
 * IMPORTS:
 * - DatabaseModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ChecklistService],
  exports: [ChecklistService],
  controllers: [ChecklistSyncController, ChecklistController],
})
export class ChecklistModule {}
