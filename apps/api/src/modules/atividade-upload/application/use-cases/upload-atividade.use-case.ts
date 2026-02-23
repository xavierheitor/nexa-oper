import { Inject, Injectable } from '@nestjs/common';
import type {
  AtividadeUploadRequestContract,
  AtividadeUploadResponseContract,
} from '../../../../contracts/atividade-upload/atividade-upload.contract';
import { AppError } from '../../../../core/errors/app-error';
import {
  ATIVIDADE_UPLOAD_REPOSITORY,
  type AtividadeUploadRepositoryPort,
} from '../../domain/ports/atividade-upload-repository.port';

@Injectable()
export class UploadAtividadeUseCase {
  constructor(
    @Inject(ATIVIDADE_UPLOAD_REPOSITORY)
    private readonly repository: AtividadeUploadRepositoryPort,
  ) {}

  async execute(
    payload: AtividadeUploadRequestContract,
    userId?: number,
  ): Promise<AtividadeUploadResponseContract> {
    const turno = await this.repository.findTurnoById(payload.turnoId);
    if (!turno) {
      throw AppError.validation(
        `Turno ${payload.turnoId} não encontrado para upload de atividade`,
      );
    }

    return this.repository.persistUpload(payload, userId);
  }
}
