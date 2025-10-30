import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MobileUsersService } from '@modules/engine/mobile-users/services/mobile-users.service';

/**
 * Serviço de Autenticação Mobile
 *
 * Este serviço gerencia toda a lógica de autenticação para usuários móveis,
 * incluindo login, geração de tokens JWT e refresh tokens. Implementa um
 * sistema de tokens com expiração configurável para segurança.
 *
 * CARACTERÍSTICAS PRINCIPAIS:
 * - Tokens JWT com expiração (access: 7 dias, refresh: 30 dias)
 * - Valida ص de credenciais com bcrypt
 * - Geração de access e refresh tokens
 * - Sistema de refresh token para renovação
 * - Logging estruturado para auditoria
 *
 * SEGURANÇA:
 * - Senhas hasheadas com bcrypt
 * - Tokens assinados com JWT_SECRET
 * - Validação rigorosa de credenciais
 * - Expiração de tokens para reduzir janela de ataque
 * - Tratamento seguro de erros
 *
 * @example
 * ```typescript
 * // Login de usuário
 * const result = await authService.validateLogin('user123', 'senha123');
 * console.log(result.token); // JWT token
 *
 * // Refresh token
 * const newTokens = await authService.refreshToken(refreshToken);
 * ```
 *
 * @since 1.0.0
 * @author Nexa Oper Team
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  /**
   * Construtor do AuthService
   *
   * Inicializa o serviço com as dependências necessárias para autenticação.
   *
   * @param mobileUsersService - Serviço para gerenciar usuários móveis
   * @param jwtService - Serviço JWT do NestJS para geração e validação de tokens
   */
  constructor(
    private readonly mobileUsersService: MobileUsersService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Valida credenciais de login e gera tokens JWT
   *
   * Este método é responsável por autenticar usuários móveis através de
   * matrícula e senha, gerando tokens JWT que não expiram automaticamente.
   *
   * FLUXO DE AUTENTICAÇÃO:
   * 1. Busca usuário pela matrícula
   * 2. Valida senha com bcrypt
   * 3. Gera access token e refresh token
   * 4. Retorna dados do usuário e tokens
   *
   * SEGURANÇA:
   * - Senha validada com bcrypt.compare()
   * - Tokens assinados com JWT_SECRET
   * - Não exposição de dados sensíveis
   *
   * @param matricula - Matrícula do usuário (username)
   * @param senha - Senha em texto plano para validação
   * @returns Promise<AuthResponse> - Dados de autenticação e tokens
   *
   * @throws {UnauthorizedException} Quando credenciais são inválidas
   *
   * @example
   * ```typescript
   * try {
   *   const auth = await authService.validateLogin('user123', 'senha123');
   *   console.log('Token:', auth.token);
   *   console.log('Usuário:', auth.usuario);
   * } catch (error) {
   *   console.error('Login falhou:', error.message);
   * }
   * ```
   */
  async validateLogin(matricula: string, senha: string) {
    // Buscar usuário pela matrícula
    const user = await this.mobileUsersService.findByMatricula(matricula);

    // Validar credenciais
    if (!user || !(await bcrypt.compare(senha, user.password))) {
      throw new UnauthorizedException('Matrícula ou senha inválida');
    }

    // Criar payload do JWT
    const payload = {
      sub: user.id,
      matricula: user.username,
    };

    // Calcular datas de expiração
    const accessTokenExpiresIn = '7d'; // Access token válido por 7 dias
    const refreshTokenExpiresIn = '30d'; // Refresh token válido por 30 dias (1 mês)

    const now = new Date();
    const accessTokenExpiresAt = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    ); // +7 dias
    const refreshTokenExpiresAt = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    ); // +30 dias

    // Gerar tokens JWT com expiração
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      token: accessToken,
      refreshToken,
      expiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
      usuario: {
        id: user.id,
        nome: user.username ?? '',
        matricula: user.username,
      },
    };
  }

  /**
   * Renova tokens JWT usando refresh token
   *
   * Este método permite renovar tokens JWT expirados ou próximos do vencimento
   * usando um refresh token válido. Gera novos tokens com as mesmas permissões
   * do usuário original.
   *
   * FLUXO DE RENOVAÇÃO:
   * 1. Valida o refresh token
   * 2. Verifica se o usuário ainda existe
   * 3. Gera novos access e refresh tokens
   * 4. Retorna novos tokens e dados do usuário
   *
   * SEGURANÇA:
   * - Validação rigorosa do refresh token
   * - Verificação de existência do usuário
   * - Geração de novos tokens com mesmo payload
   *
   * @param refreshToken - Token de renovação válido
   * @returns Promise<AuthResponse> - Novos tokens e dados do usuário
   *
   * @throws {ForbiddenException} Quando refresh token é inválido ou usuário não existe
   *
   * @example
   * ```typescript
   * try {
   *   const newAuth = await authService.refreshToken(oldRefreshToken);
   *   console.log('Novo token:', newAuth.token);
   * } catch (error) {
   *   console.error('Refresh falhou:', error.message);
   * }
   * ```
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verificar e decodificar o refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Verificar se o usuário ainda existe
      const user = await this.mobileUsersService.findById(
        payload.sub as number
      );
      if (!user) {
        throw new ForbiddenException('Usuário não encontrado');
      }

      // Calcular datas de expiração
      const accessTokenExpiresIn = '7d'; // Access token válido por 7 dias
      const refreshTokenExpiresIn = '30d'; // Refresh token válido por 30 dias (1 mês)

      const now = new Date();
      const accessTokenExpiresAt = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      ); // +7 dias
      const refreshTokenExpiresAt = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      ); // +30 dias

      // Gerar novos tokens com expiração
      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, matricula: payload.matricula },
        { expiresIn: accessTokenExpiresIn }
      );

      const newRefreshToken = this.jwtService.sign(
        { sub: payload.sub, matricula: payload.matricula },
        { expiresIn: refreshTokenExpiresIn }
      );

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
        usuario: {
          id: user.id,
          nome: user.username ?? '',
          matricula: user.username,
        },
      };
    } catch (err) {
      this.logger.error('Erro ao renovar token:', err);
      throw new ForbiddenException('Refresh token inválido ou expirado');
    }
  }
}
