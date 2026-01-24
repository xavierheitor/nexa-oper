/**
 * Guard de Chave Interna
 *
 * Verifica se a requisição contém a chave interna correta no header X-Internal-Key.
 * Usado para proteger endpoints internos que não devem ser acessíveis publicamente.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';

@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalKeyGuard.name);
  private readonly internalKey: string;

  constructor() {
    this.internalKey = process.env.INTERNAL_KEY || '';
    if (!this.internalKey) {
      this.logger.warn(
        'INTERNAL_KEY não configurada - endpoints internos estarão inacessíveis'
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providedKey = request.headers['x-internal-key'];

    if (!this.internalKey) {
      this.logger.error('INTERNAL_KEY não configurada no servidor');
      throw new UnauthorizedException('Configuração interna inválida');
    }

    if (!providedKey) {
      this.logger.warn('Tentativa de acesso sem X-Internal-Key header');
      throw new UnauthorizedException('Chave interna obrigatória');
    }

    if (providedKey !== this.internalKey) {
      this.logger.warn('Tentativa de acesso com chave interna inválida');
      throw new UnauthorizedException('Chave interna inválida');
    }

    return true;
  }
}
