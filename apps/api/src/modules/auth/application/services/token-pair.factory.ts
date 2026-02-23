import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { TokenPairContract } from '../../../../contracts/auth/auth.contract';

const ACCESS_EXPIRES = '7d';
const REFRESH_EXPIRES = '30d';

export interface IssueTokenPairResult {
  tokenPair: TokenPairContract;
  accessExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

@Injectable()
export class TokenPairFactory {
  constructor(private readonly jwtService: JwtService) {}

  issue(user: { id: number; username: string }): IssueTokenPairResult {
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_EXPIRES,
    });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      { expiresIn: REFRESH_EXPIRES },
    );

    const expiresIn = 7 * 24 * 60 * 60;

    const now = new Date();
    const accessExpiresAt = new Date(now);
    accessExpiresAt.setDate(accessExpiresAt.getDate() + 7);
    const refreshTokenExpiresAt = new Date(now);
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 30);

    return {
      tokenPair: { accessToken, refreshToken, expiresIn },
      accessExpiresAt,
      refreshTokenExpiresAt,
    };
  }
}
