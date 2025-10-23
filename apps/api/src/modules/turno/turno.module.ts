/**
 * Módulo de Turnos
 *
 * Este módulo gerencia todas as funcionalidades relacionadas
 * aos turnos da operação, incluindo abertura, fechamento,
 * validações complexas e sincronização para clientes mobile.
 *
 * ESTRUTURA:
 * - TurnoController: Endpoints de abertura, fechamento e CRUD
 * - TurnoSyncController: Endpoints de sincronização para mobile
 * - TurnoService: Lógica de negócio centralizada
 *
 * FUNCIONALIDADES:
 * - Abertura de turnos com validações de conflito
 * - Fechamento de turnos com validações de negócio
 * - CRUD completo de turnos
 * - Sincronização para clientes mobile
 * - Validações de duplicidade (veículo, equipe, eletricista)
 * - Integração com permissões de contrato
 * - Auditoria automática
 * - Logging estruturado
 *
 * DEPENDÊNCIAS:
 * - DatabaseModule: Acesso ao banco de dados
 * - AuthModule: Autenticação e permissões
 */

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@modules/engine/auth/auth.module';
import { TurnoService } from './services/turno.service';
import { ChecklistPreenchidoService } from './services/checklist-preenchido.service';
import { ChecklistFotoService } from './services/checklist-foto.service';
import {
  TurnoController,
  TurnoSyncController,
  TurnoMobileController,
  ChecklistFotoController,
} from './controllers';

/**
 * Módulo responsável pelas operações de turnos
 *
 * CONFIGURAÇÃO:
 * - Importa DatabaseModule para acesso ao Prisma
 * - Importa AuthModule para autenticação e permissões
 * - Declara controllers para endpoints HTTP
 * - Declara services para lógica de negócio
 * - Exporta services para uso em outros módulos
 */
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    MulterModule.register({
      dest: './uploads/checklists',
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [
    TurnoController,
    TurnoSyncController,
    TurnoMobileController,
    ChecklistFotoController,
  ],
  providers: [TurnoService, ChecklistPreenchidoService, ChecklistFotoService],
  exports: [TurnoService, ChecklistPreenchidoService, ChecklistFotoService],
})
export class TurnoModule {}
