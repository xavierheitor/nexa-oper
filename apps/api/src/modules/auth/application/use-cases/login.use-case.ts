import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type {
  LoginRequestContract,
  TokenPairContract,
} from '../../../../contracts/auth/auth.contract';
import { AppError } from '../../../../core/errors/app-error';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../../domain/ports/auth-session-repository.port';
import { TokenPairFactory } from '../services/token-pair.factory';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepositoryPort,
    private readonly tokenPairFactory: TokenPairFactory,
  ) {}

  async execute(input: LoginRequestContract): Promise<TokenPairContract> {
    const user = await this.sessions.findActiveUserByMatricula(input.matricula);
    if (!user) {
      throw AppError.unauthorized('Matrícula ou senha inválidos');
    }

    const valid = await bcrypt.compare(input.senha, user.password);
    if (!valid) {
      throw AppError.unauthorized('Matrícula ou senha inválidos');
    }

    const issued = this.tokenPairFactory.issue(user);
    await this.sessions.storeRefreshToken({
      userId: user.id,
      refreshToken: issued.tokenPair.refreshToken,
      accessExpiresAt: issued.accessExpiresAt,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    });

    return issued.tokenPair;
  }
}
