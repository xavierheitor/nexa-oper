import { GetTurnoUseCase } from './get-turno.use-case';

describe('GetTurnoUseCase', () => {
  it('returns detailed turno when found', async () => {
    const repo = {
      findTurnoById: jest.fn().mockResolvedValue({
        id: 10,
        status: 'ABERTO',
      }),
    };
    const useCase = new GetTurnoUseCase(repo as never);

    await expect(useCase.execute(10)).resolves.toMatchObject({ id: 10 });
    expect(repo.findTurnoById).toHaveBeenCalledWith(10, true);
  });

  it('throws not found when turno does not exist', async () => {
    const repo = {
      findTurnoById: jest.fn().mockResolvedValue(null),
    };
    const useCase = new GetTurnoUseCase(repo as never);

    await expect(useCase.execute(99)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
      message: 'Turno não encontrado',
    });
  });
});
