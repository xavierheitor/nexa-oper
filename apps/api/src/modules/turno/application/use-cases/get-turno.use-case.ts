import { Inject, Injectable } from '@nestjs/common';
import type { TurnoDetalheContract } from '../../../../contracts/turno/turno.contract';
import { AppError } from '../../../../core/errors/app-error';
import {
  TURNO_REPOSITORY,
  type TurnoRepositoryPort,
} from '../../domain/repositories/turno-repository.port';

@Injectable()
export class GetTurnoUseCase {
  constructor(
    @Inject(TURNO_REPOSITORY) private readonly repo: TurnoRepositoryPort,
  ) {}

  async execute(id: number): Promise<TurnoDetalheContract> {
    const turno = await this.repo.findTurnoById(id, true);
    if (!turno) {
      throw AppError.notFound('Turno não encontrado');
    }
    return turno as TurnoDetalheContract;
  }
}
