/**
 * DTO para Validação de Login
 *
 * Este DTO define a estrutura e validações necessárias para
 * requisições de login, garantindo que os dados sejam válidos
 * antes de processar a autenticação.
 *
 * VALIDAÇÕES IMPLEMENTADAS:
 * - matricula: Obrigatória, string não vazia
 * - senha: Obrigatória, string não vazia, mínimo 3 caracteres
 *
 * PADRÕES DE VALIDAÇÃO:
 * - Usa decorators do class-validator
 * - Mensagens de erro personalizadas em português
 * - Validação automática pelo ValidationPipe global
 *
 * @fileoverview DTO para validação de dados de login
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para dados de login
 *
 * Define a estrutura esperada e validações para requisições
 * de autenticação de usuários móveis.
 */
export class LoginDto {
  /**
   * Matrícula do usuário
   *
   * Deve ser uma string não vazia que identifica
   * unicamente o usuário no sistema.
   *
   * @example "user123"
   */
  @IsNotEmpty({ message: 'Matrícula é obrigatória' })
  @IsString({ message: 'Matrícula deve ser uma string' })
  matricula: string;

  /**
   * Senha do usuário
   *
   * Deve ser uma string com pelo menos 3 caracteres.
   * A validação de força da senha é feita no serviço.
   *
   * @example "senha123"
   */
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(3, { message: 'Senha deve ter pelo menos 3 caracteres' })
  senha: string;
}
