import { RefreshTokenUseCase } from './refresh-token.use-case';
import type { AuthSessionRepositoryPort } from '../../domain/ports/auth-session-repository.port';
import type { TokenPairFactory } from '../services/token-pair.factory';

describe('RefreshTokenUseCase', () => {
  const makeSut = () => {
    const sessions: jest.Mocked<AuthSessionRepositoryPort> = {
      findActiveUserByMatricula: jest.fn(),
      findActiveUserById: jest.fn(),
      findValidRefreshToken: jest.fn(),
      storeRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const tokenPairFactory = {
      issue: jest.fn().mockReturnValue({
        tokenPair: {
          accessToken: 'access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 604800,
        },
        accessExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
        refreshTokenExpiresAt: new Date('2026-01-24T00:00:00.000Z'),
      }),
    } as unknown as jest.Mocked<TokenPairFactory>;

    const sut = new RefreshTokenUseCase(sessions, tokenPairFactory);
    return { sut, sessions, tokenPairFactory };
  };

  it('throws unauthorized when refresh token is invalid', async () => {
    const { sut, sessions } = makeSut();
    sessions.findValidRefreshToken.mockResolvedValue(null);

    await expect(
      sut.execute({ refreshToken: 'invalid' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Refresh token inválido ou expirado',
    });
  });

  it('rotates refresh token and returns new pair', async () => {
    const { sut, sessions, tokenPairFactory } = makeSut();
    sessions.findValidRefreshToken.mockResolvedValue({
      id: 55,
      mobileUser: {
        id: 10,
        username: '123',
      },
    });
    sessions.revokeRefreshToken.mockResolvedValue(true);

    const result = await sut.execute({ refreshToken: 'current-refresh-token' });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 604800,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessions.revokeRefreshToken).toHaveBeenCalledWith(55);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(tokenPairFactory.issue).toHaveBeenCalledWith({
      id: 10,
      username: '123',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessions.storeRefreshToken).toHaveBeenCalledWith({
      userId: 10,
      refreshToken: 'new-refresh-token',
      accessExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
      refreshTokenExpiresAt: new Date('2026-01-24T00:00:00.000Z'),
    });
  });

  it('throws unauthorized when refresh token was already consumed concurrently', async () => {
    const { sut, sessions } = makeSut();
    sessions.findValidRefreshToken.mockResolvedValue({
      id: 55,
      mobileUser: { id: 10, username: '123' },
    });
    sessions.revokeRefreshToken.mockResolvedValue(false);

    await expect(
      sut.execute({ refreshToken: 'current-refresh-token' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Refresh token inválido ou expirado',
    });
  });

  it('allows only one successful refresh when two requests race with the same token', async () => {
    let revoked = false;
    let stored = 0;
    let issued = 0;

    let arrivals = 0;
    let releaseLookup!: () => void;
    const lookupBarrier = new Promise<void>((resolve) => {
      releaseLookup = resolve;
    });

    const sessions: AuthSessionRepositoryPort = {
      findActiveUserByMatricula: jest.fn(),
      findActiveUserById: jest.fn(),
      findValidRefreshToken: async () => {
        arrivals += 1;
        if (arrivals === 2) {
          releaseLookup();
        }
        await lookupBarrier;
        return {
          id: 55,
          mobileUser: { id: 10, username: '123' },
        };
      },
      storeRefreshToken: () => {
        stored += 1;
        return Promise.resolve();
      },
      revokeRefreshToken: () => {
        if (revoked) return Promise.resolve(false);
        revoked = true;
        return Promise.resolve(true);
      },
    };

    const tokenPairFactory = {
      issue: jest.fn().mockImplementation(() => {
        issued += 1;
        return {
          tokenPair: {
            accessToken: `access-token-${issued}`,
            refreshToken: `refresh-token-${issued}`,
            expiresIn: 604800,
          },
          accessExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
          refreshTokenExpiresAt: new Date('2026-01-24T00:00:00.000Z'),
        };
      }),
    } as unknown as jest.Mocked<TokenPairFactory>;

    const sut = new RefreshTokenUseCase(sessions, tokenPairFactory);

    const results = await Promise.allSettled([
      sut.execute({ refreshToken: 'same-refresh-token' }),
      sut.execute({ refreshToken: 'same-refresh-token' }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === 'rejected',
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Refresh token inválido ou expirado',
    });
    expect(stored).toBe(1);
    expect(issued).toBe(1);
  });
});
