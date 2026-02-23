export interface LoginRequestContract {
  matricula: string;
  senha: string;
}

export interface RefreshTokenRequestContract {
  refreshToken: string;
}

export interface TokenPairContract {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
