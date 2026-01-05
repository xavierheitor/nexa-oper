import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { Module } from '@nestjs/common';

import { AprSyncController } from './controllers/apr-sync.controller';
import { AprController } from './controllers/apr.controller';
import { AprService } from './services/apr.service';

/**
 * Módulo de APR (Análise Preliminar de Risco)
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos modelos de APR, incluindo CRUD e sincronização.
 *
 * CONTROLLERS:
 * - AprController: Operações CRUD (listagem paginada, criação, atualização, exclusão)
 * - AprSyncController: Sincronização para clientes mobile
 *
 * SERVICES:
 * - AprService: Lógica de negócio centralizada
 *
 * IMPORTS:
 * - DatabaseModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [AprService],
  exports: [AprService],
  controllers: [AprSyncController, AprController],
})
export class AprModule {}
