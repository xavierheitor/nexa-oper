import * as bcrypt from 'bcrypt';
import { LoginUseCase } from './login.use-case';
import type { AuthSessionRepositoryPort } from '../../domain/ports/auth-session-repository.port';
import type { TokenPairFactory } from '../services/token-pair.factory';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('LoginUseCase', () => {
  const compareMock = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

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
          refreshToken: 'refresh-token',
          expiresIn: 604800,
        },
        accessExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
        refreshTokenExpiresAt: new Date('2026-01-24T00:00:00.000Z'),
      }),
    } as unknown as jest.Mocked<TokenPairFactory>;

    const sut = new LoginUseCase(sessions, tokenPairFactory);
    return { sut, sessions, tokenPairFactory };
  };

  afterEach(() => {
    jest.restoreAllMocks();
    compareMock.mockReset();
  });

  it('throws unauthorized when user does not exist', async () => {
    const { sut, sessions } = makeSut();
    sessions.findActiveUserByMatricula.mockResolvedValue(null);

    await expect(
      sut.execute({ matricula: '123', senha: 'x' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Matrícula ou senha inválidos',
    });
  });

  it('throws unauthorized when password is invalid', async () => {
    const { sut, sessions } = makeSut();
    sessions.findActiveUserByMatricula.mockResolvedValue({
      id: 10,
      username: '123',
      password: 'hash',
    });
    compareMock.mockResolvedValue(false as never);

    await expect(
      sut.execute({ matricula: '123', senha: 'x' }),
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Matrícula ou senha inválidos',
    });
  });

  it('issues tokens and stores refresh token on success', async () => {
    const { sut, sessions, tokenPairFactory } = makeSut();
    sessions.findActiveUserByMatricula.mockResolvedValue({
      id: 10,
      username: '123',
      password: 'hash',
    });
    compareMock.mockResolvedValue(true as never);

    const result = await sut.execute({ matricula: '123', senha: 'ok' });

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 604800,
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(tokenPairFactory.issue).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessions.storeRefreshToken).toHaveBeenCalledWith({
      userId: 10,
      refreshToken: 'refresh-token',
      accessExpiresAt: new Date('2026-01-01T00:00:00.000Z'),
      refreshTokenExpiresAt: new Date('2026-01-24T00:00:00.000Z'),
    });
  });
});
