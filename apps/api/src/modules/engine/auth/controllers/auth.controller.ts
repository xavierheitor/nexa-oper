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

import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshDto } from '../dto/refresh.dto';
import { LogOperation } from '@common/decorators/log-operation.decorator';

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
   * 1. Valida dados de entrada (matrícula e senha obrigatórias)
   * 2. Valida credenciais no banco de dados
   * 3. Gera tokens JWT (access e refresh)
   * 4. Retorna dados do usuário e tokens
   *
   * VALIDAÇÕES:
   * - Matrícula: obrigatória, string não vazia
   * - Senha: obrigatória, string com mínimo 3 caracteres
   * - Retorna 400 Bad Request para dados inválidos
   * - Retorna 401 Unauthorized para credenciais inválidas
   *
   * @param loginDto - Dados de login validados
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
   * // Resposta de sucesso
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "expiresAt": "2024-01-08T10:00:00.000Z",
   *   "refreshTokenExpiresAt": "2024-02-01T10:00:00.000Z",
   *   "usuario": {
   *     "id": 123,
   *     "nome": "user123",
   *     "matricula": "user123"
   *   }
   * }
   *
   * // Resposta de erro (dados inválidos)
   * {
   *   "statusCode": 400,
   *   "message": ["Matrícula é obrigatória", "Senha é obrigatória"],
   *   "error": "Bad Request"
   * }
   * ```
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LogOperation({
    operation: 'userLogin',
    logInput: true,
    logOutput: false, // Não logar tokens na saída
    measureTime: true,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.validateLogin(loginDto.matricula, loginDto.senha);
  }

  /**
   * Endpoint de Renovação de Token
   *
   * Renova tokens JWT usando um refresh token válido,
   * permitindo que usuários mantenham acesso sem precisar
   * fazer login novamente.
   *
   * FLUXO DE RENOVAÇÃO:
   * 1. Valida dados de entrada (refresh token obrigatório)
   * 2. Valida refresh token
   * 3. Verifica se usuário ainda existe
   * 4. Gera novos tokens JWT
   * 5. Retorna novos tokens e dados do usuário
   *
   * VALIDAÇÕES:
   * - RefreshToken: obrigatório, string não vazia
   * - Retorna 400 Bad Request para dados inválidos
   * - Retorna 401 Unauthorized para token inválido
   *
   * @param refreshDto - Dados de renovação validados
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
   * // Resposta de sucesso
   * {
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "expiresAt": "2024-01-08T10:00:00.000Z",
   *   "refreshTokenExpiresAt": "2024-02-01T10:00:00.000Z",
   *   "usuario": {
   *     "id": 123,
   *     "nome": "user123",
   *     "matricula": "user123"
   *   }
   * }
   *
   * // Resposta de erro (dados inválidos)
   * {
   *   "statusCode": 400,
   *   "message": ["Refresh token é obrigatório"],
   *   "error": "Bad Request"
   * }
   * ```
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @LogOperation({
    operation: 'tokenRefresh',
    logInput: false, // Não logar refresh token
    logOutput: false, // Não logar novos tokens
    measureTime: true,
  })
  refresh(@Body() refreshDto: RefreshDto) {
    return this.authService.refreshToken(refreshDto.refreshToken);
  }
}
