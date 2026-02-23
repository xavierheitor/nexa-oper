import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContractsInfo {
  userId: number;
  contracts: number[];
  total: number;
}

const EMPTY: UserContractsInfo = { userId: 0, contracts: [], total: 0 };

/**
 * Extrai informações completas dos contratos do usuário (userId, contracts, total).
 * Requer @InjectUserContracts() ou @ListUserContracts() na rota para popular o cache.
 */
export const GetUserContractsInfo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContractsInfo => {
    const request = ctx.switchToHttp().getRequest<{
      userContractsInfo?: UserContractsInfo;
    }>();
    return request.userContractsInfo ?? EMPTY;
  },
);
