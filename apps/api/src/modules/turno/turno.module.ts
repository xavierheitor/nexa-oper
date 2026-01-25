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

import { join } from 'path';

import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@core/auth/auth.module';
import { TurnoRealizadoModule } from '@modules/turno-realizado/turno-realizado.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MulterModule } from '@nestjs/platform-express';

import { LocalDiskStorageAdapter } from '@common/storage/local-disk-storage.adapter';
import { STORAGE_PORT } from '@common/storage/storage.port';
import {
  TurnoController,
  TurnoSyncController,
  TurnoMobileController,
  ChecklistFotoController,
} from './controllers';
import {
  CreateTurnoHandler,
  CloseTurnoHandler,
  DeleteTurnoHandler,
  GetTurnosHandler,
  GetTurnoByIdHandler,
  GetTurnosForSyncHandler,
} from './cqrs';
import { TurnoEventHandler } from './events/handlers/turno-event.handler';
import { ChecklistFotoService } from './services/checklist-foto.service';
import { ChecklistPreenchidoService } from './services/checklist-preenchido.service';
import { TurnoService } from './services/turno.service';
// CQRS Handlers
// Event Handlers

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
/**
 * Módulo responsável pelas operações de turnos
 *
 * CONFIGURAÇÃO:
 * - Importa DatabaseModule para acesso ao Prisma
 * - Importa AuthModule para autenticação e permissões
 * - Importa CqrsModule para padrão CQRS (Commands/Queries)
 * - Importa EventEmitterModule para Event Sourcing
 * - Declara controllers para endpoints HTTP
 * - Declara services para lógica de negócio
 * - Declara CQRS handlers para Commands e Queries
 * - Declara Event handlers para Event Sourcing
 * - Exporta services para uso em outros módulos
 */
const checklistStorageRoot = process.env.UPLOAD_ROOT
  ? join(process.env.UPLOAD_ROOT, 'checklists')
  : join(process.cwd(), 'uploads', 'checklists');

const checklistStoragePrefix = process.env.UPLOAD_BASE_URL
  ? `${process.env.UPLOAD_BASE_URL.replace(/\/$/, '')}/checklists`
  : '/uploads/checklists';

@Module({
  imports: [
    // Módulos básicos
    DatabaseModule,
    AuthModule,
    TurnoRealizadoModule, // Para criar TurnoRealizado quando Turno é aberto

    // CQRS para separação de Commands e Queries
    CqrsModule,

    // Event Emitter para Event Sourcing
    EventEmitterModule,

    // Multer para upload de arquivos
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
  providers: [
    {
      provide: STORAGE_PORT,
      useValue: new LocalDiskStorageAdapter(
        checklistStorageRoot,
        checklistStoragePrefix
      ),
    },
    // Services
    TurnoService,
    ChecklistPreenchidoService,
    ChecklistFotoService,

    // CQRS Command Handlers
    CreateTurnoHandler,
    CloseTurnoHandler,
    DeleteTurnoHandler,

    // CQRS Query Handlers
    GetTurnosHandler,
    GetTurnoByIdHandler,
    GetTurnosForSyncHandler,

    // Event Handlers para Event Sourcing
    TurnoEventHandler,
  ],
  exports: [TurnoService, ChecklistPreenchidoService, ChecklistFotoService],
})
export class TurnoModule {}
