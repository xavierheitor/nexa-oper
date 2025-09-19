import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthModule } from '../engine/auth/module/auth.module';
import { ChecklistController } from './checklist.controller';
import { ChecklistSyncController } from './checklist-sync.controller';
import { ChecklistService } from './checklist.service';

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
 * - DbModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DbModule, AuthModule],
  providers: [ChecklistService],
  exports: [ChecklistService],
  controllers: [ChecklistController, ChecklistSyncController],
})
export class ChecklistModule {}
