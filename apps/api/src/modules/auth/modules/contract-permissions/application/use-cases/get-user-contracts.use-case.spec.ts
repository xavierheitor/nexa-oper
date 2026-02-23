import { GetUserContractsUseCase } from './get-user-contracts.use-case';

describe('GetUserContractsUseCase', () => {
  it('delegates user contracts lookup to reader port', async () => {
    const reader = {
      getUserContracts: jest.fn().mockResolvedValue({
        userId: 10,
        contracts: [1, 2],
        total: 2,
      }),
    };

    const sut = new GetUserContractsUseCase(reader as never);

    await expect(sut.execute(10)).resolves.toEqual({
      userId: 10,
      contracts: [1, 2],
      total: 2,
    });
    expect(reader.getUserContracts).toHaveBeenCalledWith(10);
  });
});
