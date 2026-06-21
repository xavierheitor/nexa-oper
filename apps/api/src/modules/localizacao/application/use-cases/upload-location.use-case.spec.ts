import { UploadLocationUseCase } from './upload-location.use-case';
import type { LocationUploadRepositoryPort } from '../../domain/ports/location-upload-repository.port';
import type { AppLogger } from '../../../../core/logger/app-logger';
import type { LocationUploadRequestContract } from '../../../../contracts/localizacao/location-upload.contract';

describe('UploadLocationUseCase', () => {
  const basePayload: LocationUploadRequestContract = {
    turnoId: 12,
    latitude: -19.123,
    longitude: -43.987,
  };

  const makeSut = () => {
    const repository: jest.Mocked<LocationUploadRepositoryPort> = {
      findTurnoById: jest.fn(),
      createLocation: jest.fn(),
    };
    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<AppLogger>;

    const sut = new UploadLocationUseCase(repository, logger);
    return { sut, repository, logger };
  };

  it('stores location when turno exists', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });

    const result = await sut.execute(basePayload, 99);

    expect(result).toEqual({ status: 'ok', alreadyExisted: false });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createLocation).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        turnoId: 12,
        createdBy: '99',
        latitude: basePayload.latitude,
        longitude: basePayload.longitude,
      }),
    );
  });

  it('normalizes eventCategory and timestamp before persisting', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });

    await sut.execute({
      turnoId: 12,
      latitude: -16.73,
      longitude: -18.83,
      eventCategory: 'apr_inicio',
      tagType: 'apr_inicio',
      timestamp: '2025-06-01T16:34:00.000Z',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'apr_inicio',
        tagType: 'apr_inicio',
        capturedAt: new Date('2025-06-01T16:34:00.000Z'),
      }),
    );
  });

  it('maps legacy turnoOpen to turno_inicio', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });

    await sut.execute({
      turnoId: 12,
      latitude: -16.73,
      longitude: -18.83,
      tagType: 'turnoOpen',
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        eventCategory: 'turno_inicio',
        tagType: 'turno_inicio',
      }),
    );
  });

  it('returns ok without persisting when turno does not exist', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue(null);

    const result = await sut.execute(basePayload);

    expect(result).toEqual({ status: 'ok', alreadyExisted: false });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repository.createLocation).not.toHaveBeenCalled();
  });

  it('returns alreadyExisted on unique signature violation', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });
    repository.createLocation.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['signature'] },
    });

    const result = await sut.execute(basePayload);

    expect(result).toEqual({ status: 'ok', alreadyExisted: true });
  });

  it('returns alreadyExisted when unique violation comes with constraint name', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });
    repository.createLocation.mockRejectedValue({
      code: 'P2002',
      meta: { constraint: 'MobileLocation_signature_key' },
      message: 'Unique constraint failed on the constraint',
    });

    const result = await sut.execute(basePayload);

    expect(result).toEqual({ status: 'ok', alreadyExisted: true });
  });

  it('returns ok on foreign key/reference error', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });
    repository.createLocation.mockRejectedValue({
      code: 'P2003',
      message: 'foreign key',
    });

    const result = await sut.execute(basePayload);

    expect(result).toEqual({ status: 'ok', alreadyExisted: false });
  });

  it('rethrows unknown errors', async () => {
    const { sut, repository } = makeSut();
    repository.findTurnoById.mockResolvedValue({ id: 12, dataFim: null });
    const unknownError = new Error('unexpected');
    repository.createLocation.mockRejectedValue(unknownError);

    await expect(sut.execute(basePayload)).rejects.toThrow('unexpected');
  });
});
