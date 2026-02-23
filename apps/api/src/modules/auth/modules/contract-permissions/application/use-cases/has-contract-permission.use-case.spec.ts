import { HasContractPermissionUseCase } from './has-contract-permission.use-case';

describe('HasContractPermissionUseCase', () => {
  it('delegates single contract permission check to reader port', async () => {
    const reader = {
      hasContractPermission: jest.fn().mockResolvedValue(true),
    };

    const sut = new HasContractPermissionUseCase(reader as never);

    await expect(sut.execute(10, 99)).resolves.toBe(true);
    expect(reader.hasContractPermission).toHaveBeenCalledWith(10, 99);
  });
});
