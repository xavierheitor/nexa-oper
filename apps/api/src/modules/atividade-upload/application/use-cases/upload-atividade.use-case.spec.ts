import { AppError } from '../../../../core/errors/app-error';
import { UploadAtividadeUseCase } from './upload-atividade.use-case';
import type { AtividadeUploadRepositoryPort } from '../../domain/ports/atividade-upload-repository.port';
import type { AtividadeUploadRequestContract } from '../../../../contracts/atividade-upload/atividade-upload.contract';

describe('UploadAtividadeUseCase', () => {
  const payload: AtividadeUploadRequestContract = {
    atividadeUuid: '550e8400-e29b-41d4-a716-446655440000',
    turnoId: 10,
    statusFluxo: 'em_execucao',
  };

  const makeSut = () => {
    const repository: jest.Mocked<AtividadeUploadRepositoryPort> = {
      findTurnoById: jest.fn(),
      persistUpload: jest.fn(),
    };
    const sut = new UploadAtividadeUseCase(repository);
    return { sut, repository };
  };

  it('throws validation error when turno is missing', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue(null);

    await expect(sut.execute(payload)).rejects.toBeInstanceOf(AppError);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.persistUpload).not.toHaveBeenCalled();
  });

  it('delegates persistence when turno exists', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: payload.turnoId });
    repository.persistUpload.mockResolvedValue({
      status: 'ok',
      atividadeExecucaoId: 77,
      atividadeUuid: payload.atividadeUuid,
      alreadyExisted: false,
      savedPhotos: 0,
    });

    const result = await sut.execute(payload, 55);

    expect(result).toEqual({
      status: 'ok',
      atividadeExecucaoId: 77,
      atividadeUuid: payload.atividadeUuid,
      alreadyExisted: false,
      savedPhotos: 0,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.persistUpload).toHaveBeenCalledWith(payload, 55);
  });
});
