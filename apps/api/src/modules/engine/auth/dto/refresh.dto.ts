/**
 * DTO para Validação de Refresh Token
 *
 * Este DTO define a estrutura e validações necessárias para
 * requisições de renovação de token, garantindo que o refresh
 * token seja válido antes de processar a renovação.
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - refreshToken: Obrigatório, string não vazia
 *
 * PADRÕES DE VALIDAÇÃO:
 * - Usa decorators do class-validator
 * - Mensagens de erro personalizadas em português
 * - Validação automática pelo ValidationPipe global
 *
 * @fileoverview DTO para validação de dados de refresh token
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para dados de refresh token
 *
 * Define a estrutura esperada e validações para requisições
 * de renovação de tokens JWT.
 */
export class RefreshDto {
  /**
   * Refresh token para renovação
   *
   * Deve ser uma string não vazia contendo um token
   * JWT válido para renovação.
   *
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  @IsString({ message: 'Refresh token deve ser uma string' })
  refreshToken: string;
}
