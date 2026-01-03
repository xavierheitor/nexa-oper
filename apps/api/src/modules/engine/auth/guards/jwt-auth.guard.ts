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

import { sanitizeHeaders, sanitizeData } from '@common/utils/logger';
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
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
  private readonly logger = new Logger(JwtAuthGuard.name);
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
    this.logger.verbose('=== INÍCIO JwtAuthGuard canActivate ===');
    this.logger.verbose(`Timestamp: ${new Date().toISOString()}`);
    this.logger.verbose(`Context type: ${context.getType()}`);

    const request = context.switchToHttp().getRequest();
    this.logger.verbose(`Request URL: ${request.url}`);
    this.logger.verbose(`Request method: ${request.method}`);
    // Sanitiza headers para evitar exposição de tokens e credenciais
    this.logger.verbose(
      `Headers: ${JSON.stringify(sanitizeHeaders(request.headers))}`
    );
    // Authorization header já está sanitizado no objeto headers
    this.logger.verbose(
      `Authorization header: ${request.headers.authorization ? '****' : 'não presente'}`
    );

    // Delegar verificação para o AuthGuard do Passport
    this.logger.verbose('Delegando verificação para AuthGuard do Passport...');
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
    this.logger.verbose('=== INÍCIO JwtAuthGuard handleRequest ===');
    this.logger.verbose(`Timestamp: ${new Date().toISOString()}`);
    this.logger.verbose(`Erro: ${JSON.stringify(err)}`);
    // Sanitiza dados do usuário para evitar exposição de informações sensíveis
    this.logger.verbose(`Usuário: ${JSON.stringify(sanitizeData(user))}`);
    this.logger.verbose(`Info: ${JSON.stringify(info)}`);
    this.logger.verbose(`Tipo do erro: ${typeof err}`);
    this.logger.verbose(`Tipo do usuário: ${typeof user}`);
    this.logger.verbose(`Tipo da info: ${typeof info}`);

    // Verificar se houve erro ou se usuário não foi encontrado
    if (err || !user) {
      this.logger.error('=== AUTENTICAÇÃO FALHOU ===');
      this.logger.error(
        `Erro na autenticação: ${err?.message || 'Usuário não encontrado'}`
      );
      this.logger.error(`Stack trace: ${err?.stack}`);
      throw err ?? new UnauthorizedException('Token inválido ou expirado');
    }

    // Retornar dados do usuário autenticado
    this.logger.verbose('=== AUTENTICAÇÃO BEM-SUCEDIDA ===');
    // Sanitiza dados do usuário para evitar exposição de informações sensíveis
    this.logger.verbose(
      `Usuário autenticado: ${JSON.stringify(sanitizeData(user))}`
    );
    this.logger.verbose('=== FIM JwtAuthGuard handleRequest ===');
    return user;
  }
}
