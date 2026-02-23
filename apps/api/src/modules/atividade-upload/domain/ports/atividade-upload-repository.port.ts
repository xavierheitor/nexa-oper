import type {
  AtividadeUploadRequestContract,
  AtividadeUploadResponseContract,
} from '../../../../contracts/atividade-upload/atividade-upload.contract';

export const ATIVIDADE_UPLOAD_REPOSITORY = Symbol(
  'ATIVIDADE_UPLOAD_REPOSITORY',
);

export interface AtividadeTurnoSnapshotPort {
  id: number;
}

export interface AtividadeUploadRepositoryPort {
  findTurnoById(turnoId: number): Promise<AtividadeTurnoSnapshotPort | null>;
  persistUpload(
    payload: AtividadeUploadRequestContract,
    userId?: number,
  ): Promise<AtividadeUploadResponseContract>;
}
