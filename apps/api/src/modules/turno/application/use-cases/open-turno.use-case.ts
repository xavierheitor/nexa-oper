import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  AbrirTurnoRequestContract,
  AbrirTurnoResponseContract,
} from '../../../../contracts/turno/abrir-turno.contract';
import { MobileAppVersionGateService } from '../../../../core/mobile-app-version/mobile-app-version-gate.service';
import { AppLogger } from '../../../../core/logger/app-logger';
import { PrismaService } from '../../../../database/prisma.service';
import { TurnoChecklistSyncQueueService } from '../../checklist-preenchido/turno-checklist-sync-queue.service';
import { AbrirTurnoDto } from '../../dto/abrir-turno.dto';
import { TurnoAbertoEvent } from '../../events/turno-aberto.event';
import {
  TURNO_REPOSITORY,
  type TurnoRepositoryPort,
} from '../../domain/repositories/turno-repository.port';
import { validateAbrirTurno } from '../../turno.validation';

@Injectable()
export class OpenTurnoUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY) private readonly repo: TurnoRepositoryPort,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly checklistSyncQueue: TurnoChecklistSyncQueueService,
    private readonly eventEmitter: EventEmitter2,
    private readonly mobileAppVersionGate: MobileAppVersionGateService,
  ) {}

  async execute(
    input: AbrirTurnoRequestContract,
  ): Promise<AbrirTurnoResponseContract> {
    const dto: AbrirTurnoDto = input;
    const createdBy = 'system';

    this.mobileAppVersionGate.assertSupportedVersion({
      action: 'open-turno',
      versaoApp: dto.versaoApp,
      plataformaApp: dto.plataformaApp,
    });

    let checklistQueueId: number | null = null;

    const turno = await this.prisma.$transaction(async (tx) => {
      await validateAbrirTurno(dto, tx as PrismaService);

      const created = await this.repo.createTurno(dto, tx as PrismaService);

      if (dto.checklists?.length) {
        checklistQueueId = await this.checklistSyncQueue.enqueueInTransaction(
          tx,
          {
            turnoId: created.id,
            checklists: dto.checklists,
            createdBy,
          },
        );
      }

      return created;
    });

    if (checklistQueueId != null) {
      this.checklistSyncQueue.processPendingForTurno(turno.id);
    }

    const dataInicio = dto.dataInicio ?? new Date();
    const dataReferencia = new Date(dataInicio);
    dataReferencia.setHours(0, 0, 0, 0);

    this.eventEmitter.emit(
      'turno.aberto',
      new TurnoAbertoEvent(
        turno.id,
        dto.equipeId,
        dataReferencia,
        dto.eletricistas,
        dto.dispositivo,
        dto.versaoApp,
        [],
        [],
      ),
    );

    this.logger.operation('Turno aberto', {
      turnoId: turno.id,
      checklistQueueId,
    });

    const response = {
      ...turno,
      status: turno.dataFim == null ? 'ABERTO' : 'FECHADO',
      remoteId: turno.id,
      checklistsSalvos: 0,
      ...(checklistQueueId != null && {
        checklistSyncStatus: 'pending' as const,
        processamentoAssincrono: 'Checklists em processamento',
      }),
    } satisfies AbrirTurnoResponseContract;

    return response;
  }
}
