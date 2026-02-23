import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppError } from '../../../core/errors/app-error';
import { env } from '../../../core/config/env';
import { ValidateAuthUserUseCase } from '../application/use-cases/validate-auth-user.use-case';

export interface JwtPayload {
  sub: number;
  username?: string;
}

/**
 * Estratégia de autenticação JWT via Passport.
 *
 * Responsável por extrair o token do cabeçalho `Authorization: Bearer <token>`,
 * validar sua assinatura e expiração, e popular o `request.user` com os dados do usuário.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly validateAuthUserUseCase: ValidateAuthUserUseCase,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  /**
   * Valida o payload do JWT após a verificação da assinatura.
   * Busca o usuário no banco para garantir que ele ainda existe.
   *
   * @param payload - O payload decodificado do JWT.
   * @returns O objeto do usuário (injetado em `request.user`).
   * @throws {AppError} Se o usuário não for encontrado.
   */
  async validate(payload: JwtPayload) {
    const user = await this.validateAuthUserUseCase.execute(payload.sub);
    if (!user) {
      throw AppError.unauthorized('Usuário não encontrado');
    }
    return { id: user.id, sub: user.id, username: user.username };
  }
}
