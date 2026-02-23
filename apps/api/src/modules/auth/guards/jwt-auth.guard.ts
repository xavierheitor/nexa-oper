import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../../core/auth/public.decorator';

@Injectable()
/**
 * Guard global de autenticação JWT.
 *
 * Verifica se a rota ou o controlador estão marcados como públicos (@Public).
 * Se não estiverem, delega a validação para o `AuthGuard('jwt')` do Passport,
 * que usa a `JwtStrategy` para validar o token.
 */
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
