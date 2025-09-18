/**
 * Guard de Autenticação JWT
 *
 * Este guard implementa a proteção de rotas usando autenticação JWT.
 * É responsável por verificar a presença e validade de tokens JWT nas
 * requisições, garantindo que apenas usuários autenticados acessem
 * recursos protegidos.
 *
 * FUNCIONALIDADES:
 * - Verificação automática de tokens JWT
 * - Logging detalhado para debugging
 * - Tratamento de erros de autenticação
 * - Integração com Passport Strategy
 *
 * SEGURANÇA:
 * - Validação rigorosa de tokens
 * - Rejeição de requisições não autenticadas
 * - Logs de auditoria para tentativas de acesso
 *
 * @fileoverview Guard para proteção de rotas com JWT
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de Autenticação JWT
 *
 * Protege rotas que requerem autenticação, verificando a presença
 * e validade de tokens JWT nas requisições.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Verifica se a requisição pode ser ativada (autenticada)
   *
   * Este método é chamado antes da validação do token para realizar
   * verificações preliminares e logging da tentativa de autenticação.
   *
   * @param context - Contexto de execução da requisição
   * @returns Promise<boolean> - true se pode prosseguir com autenticação
   */
  canActivate(context: ExecutionContext) {
    console.log('[JWT GUARD] Verificando autenticação...');

    const request = context.switchToHttp().getRequest();
    console.log('[JWT GUARD] Headers:', request.headers);

    // Delegar verificação para o AuthGuard do Passport
    return super.canActivate(context);
  }

  /**
   * Processa o resultado da autenticação JWT
   *
   * Este método é chamado após a validação do token JWT pela estratégia.
   * É responsável por processar o resultado e decidir se a autenticação
   * foi bem-sucedida ou se deve rejeitar a requisição.
   *
   * @param err - Erro ocorrido durante a autenticação
   * @param user - Dados do usuário autenticado (se sucesso)
   * @param info - Informações adicionais sobre a autenticação
   * @returns Dados do usuário autenticado
   *
   * @throws {UnauthorizedException} Quando autenticação falha
   */
  handleRequest(err: any, user: any, info: any) {
    console.log('[JWT GUARD] Erro:', err);
    console.log('[JWT GUARD] Usuário:', user);
    console.log('[JWT GUARD] Info:', info);

    // Verificar se houve erro ou se usuário não foi encontrado
    if (err || !user) {
      throw err ?? new UnauthorizedException('Token inválido ou expirado');
    }

    // Retornar dados do usuário autenticado
    return user;
  }
}
