import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database';
import type {
  AuthRefreshTokenRowPort,
  AuthSessionRepositoryPort,
  AuthUserPort,
  StoreRefreshTokenInputPort,
} from '../domain/ports/auth-session-repository.port';

@Injectable()
export class AuthService implements AuthSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  findActiveUserByMatricula(matricula: string): Promise<AuthUserPort | null> {
    return this.prisma.mobileUser.findFirst({
      where: {
        username: matricula,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });
  }

  findActiveUserById(userId: number): Promise<AuthUserPort | null> {
    return this.prisma.mobileUser.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        username: true,
        password: true,
      },
    });
  }

  async findValidRefreshToken(
    refreshToken: string,
  ): Promise<AuthRefreshTokenRowPort | null> {
    const row = await this.prisma.mobileToken.findFirst({
      where: {
        refreshToken,
        revoked: false,
        refreshTokenExpiresAt: { gt: new Date() },
      },
      include: {
        mobileUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!row?.mobileUser) {
      return null;
    }

    return {
      id: row.id,
      mobileUser: row.mobileUser,
    };
  }

  async storeRefreshToken(input: StoreRefreshTokenInputPort): Promise<void> {
    await this.prisma.mobileToken.create({
      data: {
        token: randomBytes(32).toString('hex'),
        refreshToken: input.refreshToken,
        refreshTokenExpiresAt: input.refreshTokenExpiresAt,
        usuarioMobileId: String(input.userId),
        expiresAt: input.accessExpiresAt,
        mobileUserId: input.userId,
      },
    });
  }

  async revokeRefreshToken(tokenId: number): Promise<boolean> {
    const result = await this.prisma.mobileToken.updateMany({
      where: { id: tokenId, revoked: false },
      data: { revoked: true },
    });
    return result.count > 0;
  }
}
