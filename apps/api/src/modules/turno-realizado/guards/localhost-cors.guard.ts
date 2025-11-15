/**
 * Guard de CORS para Localhost
 *
 * Este guard verifica se a requisição vem de localhost (127.0.0.1 ou localhost)
 * e permite apenas essas origens. Usado para endpoints de debug/administração
 * que não devem ser acessíveis publicamente.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class LocalhostCorsGuard implements CanActivate {
  private readonly logger = new Logger(LocalhostCorsGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin || request.headers.referer;

    // Se não tem origin (curl, Postman, etc), permite apenas se vier de localhost
    if (!origin) {
      const host = request.headers.host || '';
      const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

      if (!isLocalhost) {
        this.logger.warn(`Acesso negado: requisição sem origin de ${host}`);
        throw new ForbiddenException('Este endpoint só pode ser acessado de localhost');
      }

      return true;
    }

    // Verificar se origin é localhost
    try {
      const url = new URL(origin);
      const hostname = url.hostname.toLowerCase();

      const isLocalhost =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('127.');

      if (!isLocalhost) {
        this.logger.warn(`Acesso negado: origin ${origin} não é localhost`);
        throw new ForbiddenException('Este endpoint só pode ser acessado de localhost');
      }

      this.logger.debug(`Acesso permitido: origin ${origin} é localhost`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.warn(`Erro ao validar origin ${origin}: ${error}`);
      throw new ForbiddenException('Origin inválido');
    }
  }
}

