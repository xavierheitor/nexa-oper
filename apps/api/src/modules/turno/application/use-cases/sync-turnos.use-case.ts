import { Inject, Injectable } from '@nestjs/common';
import type {
  SyncTurnosInputContract,
  TurnoDetalheContract,
} from '../../../../contracts/turno/turno.contract';
import {
  TURNO_REPOSITORY,
  type TurnoRepositoryPort,
} from '../../domain/repositories/turno-repository.port';

@Injectable()
export class SyncTurnosUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY) private readonly repo: TurnoRepositoryPort,
  ) {}

  execute(input: SyncTurnosInputContract): Promise<TurnoDetalheContract[]> {
    return this.repo.findTurnosForSync(input.since, input.limit);
  }
}
