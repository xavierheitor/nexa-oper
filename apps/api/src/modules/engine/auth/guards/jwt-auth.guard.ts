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
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { sanitizeHeaders, sanitizeData } from '@common/utils/logger';

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
    this.logger.debug('=== INÍCIO JwtAuthGuard canActivate ===');
    this.logger.debug(`Timestamp: ${new Date().toISOString()}`);
    this.logger.debug(`Context type: ${context.getType()}`);

    const request = context.switchToHttp().getRequest();
    this.logger.debug(`Request URL: ${request.url}`);
    this.logger.debug(`Request method: ${request.method}`);
    // Sanitiza headers para evitar exposição de tokens e credenciais
    this.logger.debug(
      `Headers: ${JSON.stringify(sanitizeHeaders(request.headers))}`
    );
    // Authorization header já está sanitizado no objeto headers
    this.logger.debug(
      `Authorization header: ${request.headers.authorization ? '****' : 'não presente'}`
    );

    // Delegar verificação para o AuthGuard do Passport
    this.logger.debug('Delegando verificação para AuthGuard do Passport...');
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
    this.logger.debug('=== INÍCIO JwtAuthGuard handleRequest ===');
    this.logger.debug(`Timestamp: ${new Date().toISOString()}`);
    this.logger.debug(`Erro: ${JSON.stringify(err)}`);
    // Sanitiza dados do usuário para evitar exposição de informações sensíveis
    this.logger.debug(`Usuário: ${JSON.stringify(sanitizeData(user))}`);
    this.logger.debug(`Info: ${JSON.stringify(info)}`);
    this.logger.debug(`Tipo do erro: ${typeof err}`);
    this.logger.debug(`Tipo do usuário: ${typeof user}`);
    this.logger.debug(`Tipo da info: ${typeof info}`);

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
    this.logger.debug('=== AUTENTICAÇÃO BEM-SUCEDIDA ===');
    // Sanitiza dados do usuário para evitar exposição de informações sensíveis
    this.logger.debug(
      `Usuário autenticado: ${JSON.stringify(sanitizeData(user))}`
    );
    this.logger.debug('=== FIM JwtAuthGuard handleRequest ===');
    return user;
  }
}
