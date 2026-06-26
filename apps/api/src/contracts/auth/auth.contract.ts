export interface LoginRequestContract {
  matricula: string;
  senha: string;
  versaoApp?: string;
  plataformaApp?: string;
  buildApp?: string;
  dispositivo?: string;
}

export interface RefreshTokenRequestContract {
  refreshToken: string;
}

export interface TokenPairContract {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  permissions?: string[];
  navigationPermissions?: string[];
}
