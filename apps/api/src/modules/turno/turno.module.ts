import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database';
import { LoggerModule } from '../../core/logger/logger.module';
import { UploadModule } from '../upload/upload.module';
import { TurnoController } from './turno.controller';
import { TurnoRepository } from './turno.repository';
import { TurnoRealizadoService } from './turno-realizado/turno-realizado.service';
import { ChecklistPreenchidoService } from './checklist-preenchido/checklist-preenchido.service';
import { AbrirTurnoRealizadoListener } from './listeners/abrir-turno-realizado.listener';
import { ProcessarChecklistListener } from './listeners/processar-checklist.listener';
import { OpenTurnoUseCase } from './application/use-cases/open-turno.use-case';
import { CloseTurnoUseCase } from './application/use-cases/close-turno.use-case';
import { ListTurnosUseCase } from './application/use-cases/list-turnos.use-case';
import { GetTurnoUseCase } from './application/use-cases/get-turno.use-case';
import { SyncTurnosUseCase } from './application/use-cases/sync-turnos.use-case';
import { TURNO_REPOSITORY } from './domain/repositories/turno-repository.port';

@Module({
  imports: [DatabaseModule, LoggerModule, UploadModule],
  controllers: [TurnoController],
  providers: [
    TurnoRepository,
    OpenTurnoUseCase,
    CloseTurnoUseCase,
    ListTurnosUseCase,
    GetTurnoUseCase,
    SyncTurnosUseCase,
    { provide: TURNO_REPOSITORY, useExisting: TurnoRepository },
    TurnoRealizadoService,
    ChecklistPreenchidoService,
    AbrirTurnoRealizadoListener,
    ProcessarChecklistListener,
  ],
  exports: [TurnoRealizadoService, ChecklistPreenchidoService],
})
export class TurnoModule {}
