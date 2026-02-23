import { Inject, Injectable } from '@nestjs/common';
import type {
  ListTurnosResponseContract,
  TurnoQueryContract,
} from '../../../../contracts/turno/turno.contract';
import { TurnoStatus, type TurnoQueryDto } from '../../dto/turno-query.dto';
import {
  TURNO_REPOSITORY,
  type TurnoRepositoryPort,
} from '../../domain/repositories/turno-repository.port';

@Injectable()
export class ListTurnosUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY) private readonly repo: TurnoRepositoryPort,
  ) {}

  execute(query: TurnoQueryContract): Promise<ListTurnosResponseContract> {
    let status: TurnoQueryDto['status'];
    if (query.status === 'ABERTO') status = TurnoStatus.ABERTO;
    if (query.status === 'FECHADO') status = TurnoStatus.FECHADO;

    const dto: TurnoQueryDto = {
      ...query,
      status,
    };
    return this.repo.listTurnos(dto);
  }
}
