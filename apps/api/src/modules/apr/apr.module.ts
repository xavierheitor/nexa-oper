import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthModule } from '../auth/module/auth.module';
import { AprController } from './apr.controller';
import { AprSyncController } from './apr-sync.controller';
import { AprService } from './apr.service';

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
 * - DbModule: Acesso ao banco de dados via Prisma
 * - AuthModule: Autenticação e autorização
 */
@Module({
  imports: [DbModule, AuthModule],
  providers: [AprService],
  exports: [AprService],
  controllers: [AprController, AprSyncController],
})
export class AprModule {}
