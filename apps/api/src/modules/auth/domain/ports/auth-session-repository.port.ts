export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

export interface AuthUserPort {
  id: number;
  username: string;
  password: string;
}

export interface AuthRefreshTokenRowPort {
  id: number;
  mobileUser: {
    id: number;
    username: string;
  };
}

export interface StoreRefreshTokenInputPort {
  userId: number;
  refreshToken: string;
  accessExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export interface AuthSessionRepositoryPort {
  findActiveUserByMatricula(matricula: string): Promise<AuthUserPort | null>;
  findActiveUserById(userId: number): Promise<AuthUserPort | null>;
  findValidRefreshToken(
    refreshToken: string,
  ): Promise<AuthRefreshTokenRowPort | null>;
  storeRefreshToken(input: StoreRefreshTokenInputPort): Promise<void>;
  revokeRefreshToken(tokenId: number): Promise<boolean>;
}
