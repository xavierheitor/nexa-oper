import type { ExecutionContext } from '@nestjs/common';
import { AppError } from '../../../../../core/errors/app-error';
import { CONTRACT_PERMISSION_KEY, LIST_USER_CONTRACTS_KEY } from '../constants';
import { ContractPermissionsGuard } from './contract-permissions.guard';

type ReflectorMock = {
  getAllAndOverride: jest.Mock;
};

type HasContractPermissionUseCaseMock = {
  execute: jest.Mock;
};

type HasAnyContractPermissionUseCaseMock = {
  execute: jest.Mock;
};

type GetUserContractsUseCaseMock = {
  execute: jest.Mock;
};

function makeContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => class TestClass {},
  } as ExecutionContext;
}

describe('ContractPermissionsGuard', () => {
  let reflector: ReflectorMock;
  let hasContractPermissionUseCase: HasContractPermissionUseCaseMock;
  let hasAnyContractPermissionUseCase: HasAnyContractPermissionUseCaseMock;
  let getUserContractsUseCase: GetUserContractsUseCaseMock;
  let guard: ContractPermissionsGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === LIST_USER_CONTRACTS_KEY) return false;
        if (key === CONTRACT_PERMISSION_KEY) {
          return {
            paramName: 'contratoIds',
            mode: 'any',
            required: true,
          };
        }
        return undefined;
      }),
    };

    hasContractPermissionUseCase = {
      execute: jest.fn(),
    };

    hasAnyContractPermissionUseCase = {
      execute: jest.fn(),
    };

    getUserContractsUseCase = {
      execute: jest.fn(),
    };

    guard = new ContractPermissionsGuard(
      reflector as never,
      hasContractPermissionUseCase as never,
      hasAnyContractPermissionUseCase as never,
      getUserContractsUseCase as never,
    );
  });

  it('rejects partially invalid contract ids', async () => {
    const context = makeContext({
      user: { id: 10 },
      query: { contratoIds: '12abc' },
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    } satisfies Partial<AppError>);
    expect(hasAnyContractPermissionUseCase.execute).not.toHaveBeenCalled();
  });

  it('accepts comma-separated valid ids', async () => {
    hasAnyContractPermissionUseCase.execute.mockResolvedValue(true);
    const context = makeContext({
      user: { id: 10 },
      query: { contratoIds: '1,2,3' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(hasAnyContractPermissionUseCase.execute).toHaveBeenCalledWith(
      10,
      [1, 2, 3],
    );
  });

  it('checks all mode using cached contract list in a single lookup', async () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === LIST_USER_CONTRACTS_KEY) return false;
      if (key === CONTRACT_PERMISSION_KEY) {
        return {
          paramName: 'contratoIds',
          mode: 'all',
          required: true,
        };
      }
      return undefined;
    });
    getUserContractsUseCase.execute.mockResolvedValue({
      userId: 10,
      contracts: [1, 2, 3],
      total: 3,
    });

    const context = makeContext({
      user: { id: 10 },
      query: { contratoIds: '1,2,3' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getUserContractsUseCase.execute).toHaveBeenCalledWith(10);
    expect(hasContractPermissionUseCase.execute).not.toHaveBeenCalled();
  });
});
