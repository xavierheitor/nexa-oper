import { ValidateAuthUserUseCase } from './validate-auth-user.use-case';
import type { AuthSessionRepositoryPort } from '../../domain/ports/auth-session-repository.port';

describe('ValidateAuthUserUseCase', () => {
  it('delegates lookup to repository port', async () => {
    const sessions: jest.Mocked<AuthSessionRepositoryPort> = {
      findActiveUserByMatricula: jest.fn(),
      findActiveUserById: jest.fn().mockResolvedValue({
        id: 77,
        username: 'm123',
        password: 'hash',
      }),
      findValidRefreshToken: jest.fn(),
      storeRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const sut = new ValidateAuthUserUseCase(sessions);

    await expect(sut.execute(77)).resolves.toMatchObject({
      id: 77,
      username: 'm123',
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(sessions.findActiveUserById).toHaveBeenCalledWith(77);
  });
});
