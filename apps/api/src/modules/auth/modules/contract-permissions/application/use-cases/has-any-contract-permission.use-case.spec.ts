import { HasAnyContractPermissionUseCase } from './has-any-contract-permission.use-case';

describe('HasAnyContractPermissionUseCase', () => {
  it('delegates multi-contract permission check to reader port', async () => {
    const reader = {
      hasAnyContractPermission: jest.fn().mockResolvedValue(true),
    };

    const sut = new HasAnyContractPermissionUseCase(reader as never);

    await expect(sut.execute(10, [1, 2, 3])).resolves.toBe(true);
    expect(reader.hasAnyContractPermission).toHaveBeenCalledWith(10, [1, 2, 3]);
  });
});
