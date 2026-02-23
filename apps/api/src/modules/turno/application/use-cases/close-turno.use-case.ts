import { Inject, Injectable } from '@nestjs/common';
import type {
  FecharTurnoRequestContract,
  TurnoSummaryContract,
} from '../../../../contracts/turno/turno.contract';
import { AppLogger } from '../../../../core/logger/app-logger';
import { PrismaService } from '../../../../database/prisma.service';
import { TurnoRealizadoService } from '../../turno-realizado/turno-realizado.service';
import type { FecharTurnoDto } from '../../dto/fechar-turno.dto';
import {
  TURNO_REPOSITORY,
  type TurnoRepositoryPort,
} from '../../domain/repositories/turno-repository.port';
import { validateFecharTurno } from '../../turno.validation';

@Injectable()
export class CloseTurnoUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY) private readonly repo: TurnoRepositoryPort,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
    private readonly turnoRealizadoService: TurnoRealizadoService,
  ) {}

  async execute(
    input: FecharTurnoRequestContract,
  ): Promise<TurnoSummaryContract> {
    const dto: FecharTurnoDto = input;
    await validateFecharTurno(dto, this.prisma);

    const turno = await this.repo.closeTurno(dto);
    await this.turnoRealizadoService.fecharTurnoPorTurnoId(turno.id, 'system');

    this.logger.operation('Turno fechado', { turnoId: turno.id });
    return turno;
  }
}
