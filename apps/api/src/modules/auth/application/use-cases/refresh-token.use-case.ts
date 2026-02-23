import { Inject, Injectable } from '@nestjs/common';
import type {
  RefreshTokenRequestContract,
  TokenPairContract,
} from '../../../../contracts/auth/auth.contract';
import { AppError } from '../../../../core/errors/app-error';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../../domain/ports/auth-session-repository.port';
import { TokenPairFactory } from '../services/token-pair.factory';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly sessions: AuthSessionRepositoryPort,
    private readonly tokenPairFactory: TokenPairFactory,
  ) {}

  async execute(
    input: RefreshTokenRequestContract,
  ): Promise<TokenPairContract> {
    const row = await this.sessions.findValidRefreshToken(input.refreshToken);
    if (!row?.mobileUser) {
      throw AppError.unauthorized('Refresh token inválido ou expirado');
    }

    const revoked = await this.sessions.revokeRefreshToken(row.id);
    if (!revoked) {
      throw AppError.unauthorized('Refresh token inválido ou expirado');
    }

    const issued = this.tokenPairFactory.issue(row.mobileUser);
    await this.sessions.storeRefreshToken({
      userId: row.mobileUser.id,
      refreshToken: issued.tokenPair.refreshToken,
      accessExpiresAt: issued.accessExpiresAt,
      refreshTokenExpiresAt: issued.refreshTokenExpiresAt,
    });

    return issued.tokenPair;
  }
}
