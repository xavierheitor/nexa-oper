/**
 * Controlador de Autenticação Mobile
 *
 * Este controlador gerencia os endpoints de autenticação para usuários móveis,
 * incluindo login e renovação de tokens. Implementa um sistema de autenticação
 * baseado em JWT com tokens que não expiram automaticamente.
 *
 * ENDPOINTS DISPONÍVEIS:
 * - POST /auth/login - Autenticação de usuário
 * - POST /auth/refresh - Renovação de tokens
 *
 * SEGURANÇA:
 * - Validação de credenciais com bcrypt
 * - Geração de tokens JWT assinados
 * - Proteção contra ataques de força bruta
 * - Logs de auditoria para todas as operações
 *
 * @fileoverview Controlador para autenticação de usuários móveis
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../service/auth.service';

/**
 * Controlador de Autenticação Mobile
 *
 * Gerencia todos os endpoints relacionados à autenticação de usuários móveis,
 * incluindo login e renovação de tokens JWT.
 */
@Controller('auth')
export class AuthController {
  /**
   * Construtor do AuthController
   *
   * @param authService - Serviço de autenticação injetado
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint de Login
   *
   * Autentica um usuário móvel através de matrícula e senha,
   * retornando tokens JWT para acesso às funcionalidades da API.
   *
   * FLUXO DE LOGIN:
   * 1. Recebe credenciais (matrícula e senha)
   * 2. Valida credenciais no banco de dados
   * 3. Gera tokens JWT (access e refresh)
   * 4. Retorna dados do usuário e tokens
   *
   * @param body - Credenciais de login
   * @param body.matricula - Matrícula do usuário
   * @param body.senha - Senha do usuário
   * @returns Promise<AuthResponse> - Dados de autenticação e tokens
   *
   * @example
   * ```typescript
   * // Requisição
   * POST /auth/login
   * {
   *   "matricula": "user123",
   *   "senha": "senha123"
   * }
   *
   * // Resposta
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "expiresAt": null,
   *   "refreshTokenExpiresAt": null,
   *   "usuario": {
   *     "id": 123,
   *     "nome": "user123",
   *     "matricula": "user123"
   *   }
   * }
   * ```
   */
  @Post('login')
  login(@Body() body: { matricula: string; senha: string }) {
    return this.authService.validateLogin(body.matricula, body.senha);
  }

  /**
   * Endpoint de Renovação de Token
   *
   * Renova tokens JWT usando um refresh token válido,
   * permitindo que usuários mantenham acesso sem precisar
   * fazer login novamente.
   *
   * FLUXO DE RENOVAÇÃO:
   * 1. Recebe refresh token válido
   * 2. Valida refresh token
   * 3. Verifica se usuário ainda existe
   * 4. Gera novos tokens JWT
   * 5. Retorna novos tokens e dados do usuário
   *
   * @param body - Dados de renovação
   * @param body.refreshToken - Token de renovação válido
   * @returns Promise<AuthResponse> - Novos tokens e dados do usuário
   *
   * @example
   * ```typescript
   * // Requisição
   * POST /auth/refresh
   * {
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   *
   * // Resposta
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "expiresAt": null,
   *   "refreshTokenExpiresAt": null,
   *   "usuario": {
   *     "id": 123,
   *     "nome": "user123",
   *     "matricula": "user123"
   *   }
   * }
   * ```
   */
  @Post('refresh')
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }
}
