import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrai os IDs dos contratos do usuário autenticado.
 * Requer @InjectUserContracts() ou @ListUserContracts() na rota para popular o cache.
 */
export const GetUserContracts = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number[] => {
    const request = ctx.switchToHttp().getRequest<{
      userContracts?: number[];
    }>();
    return request.userContracts ?? [];
  },
);
