import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type {
  AbrirTurnoRequestContract,
  AbrirTurnoResponseContract,
} from '../../../../contracts/turno/abrir-turno.contract';
import { AppLogger } from '../../../../core/logger/app-logger';
import { PrismaService } from '../../../../database/prisma.service';
import { ChecklistPreenchidoService } from '../../checklist-preenchido/checklist-preenchido.service';
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
    private readonly checklistPreenchidoService: ChecklistPreenchidoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(
    input: AbrirTurnoRequestContract,
  ): Promise<AbrirTurnoResponseContract> {
    const dto: AbrirTurnoDto = input;

    let checklistPreenchidoIds: number[] = [];
    let respostasAguardandoFoto: number[] = [];

    const turno = await this.prisma.$transaction(
      async (tx) => {
        await validateAbrirTurno(dto, tx as PrismaService);

        const created = await this.repo.createTurno(dto, tx as PrismaService);

        if (dto.checklists?.length) {
          const result =
            await this.checklistPreenchidoService.salvarChecklistsDoTurno(
              {
                turnoId: created.id,
                checklists: dto.checklists,
              },
              tx as PrismaService,
            );
          checklistPreenchidoIds = result.checklistPreenchidoIds;
          respostasAguardandoFoto = result.respostasAguardandoFoto;
        }

        return created;
      },
      { timeout: 15000 },
    );

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
        checklistPreenchidoIds,
        respostasAguardandoFoto,
      ),
    );

    this.logger.operation('Turno aberto', { turnoId: turno.id });

    const response = {
      ...turno,
      status: turno.dataFim == null ? 'ABERTO' : 'FECHADO',
      remoteId: turno.id,
      checklistsSalvos: checklistPreenchidoIds.length,
      ...(respostasAguardandoFoto.length > 0 && {
        respostasAguardandoFoto,
        processamentoAssincrono: 'Em andamento',
      }),
    } satisfies AbrirTurnoResponseContract;

    return response;
  }
}
