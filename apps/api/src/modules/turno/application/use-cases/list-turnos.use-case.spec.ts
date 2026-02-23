import { ListTurnosUseCase } from './list-turnos.use-case';

describe('ListTurnosUseCase', () => {
  it('delegates listing to repository port', async () => {
    const repo = {
      listTurnos: jest.fn().mockResolvedValue({
        items: [],
        meta: { total: 0, page: 1, limit: 20 },
      }),
    };

    const useCase = new ListTurnosUseCase(repo as never);
    const result = await useCase.execute({ page: 1, limit: 20 });

    expect(result.meta).toEqual({ total: 0, page: 1, limit: 20 });
    expect(repo.listTurnos).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });
});
