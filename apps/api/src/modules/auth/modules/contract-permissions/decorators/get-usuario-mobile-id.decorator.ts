import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrai o ID do usuário mobile autenticado de request.user.
 * Usado em rotas protegidas após JwtAuthGuard.
 */
export const GetUsuarioMobileId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<{
      user?: { id?: number; sub?: number };
    }>();
    return request.user?.id ?? request.user?.sub;
  },
);
