/**
 * Estratégia JWT para Autenticação Mobile
 *
 * Esta estratégia implementa a validação de tokens JWT para usuários móveis,
 * configurada para validar tokens com expiração. É responsável por extrair
 * e validar tokens do header Authorization das requisições.
 *
 * CARACTERÍSTICAS:
 * - Extração automática de tokens do header Bearer
 * - Validação de assinatura com JWT_SECRET
 * - Validação de expiração dos tokens
 * - Logging detalhado para debugging
 *
 * SEGURANÇA:
 * - Validação rigorosa de assinatura JWT
 * - Validação de expiração de tokens
 * - Extração segura de tokens do header
 * - Tratamento de tokens inválidos ou expirados
 *
 * @fileoverview Estratégia Passport para validação de JWT tokens
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Obtém o JWT_SECRET validado
 *
 * Garante que JWT_SECRET está configurado e é seguro.
 * A validação completa é feita no bootstrap, mas esta função
 * fornece um erro claro se a variável não estiver disponível.
 *
 * @returns JWT_SECRET configurado
 * @throws {Error} Se JWT_SECRET não estiver configurado
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  /**
   * Construtor da JwtStrategy
   *
   * Configura a estratégia JWT com as opções necessárias para autenticação
   * de usuários móveis, incluindo extração de tokens e validação de assinatura.
   * Utiliza ConfigService para obter o segredo, garantindo consistência.
   */
  constructor(configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET não está configurado. Verifique as variáveis de ambiente.'
      );
    }

    super({
      // Extrair token do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ✅ Validar expiração dos tokens
      // Tokens expirados serão rejeitados automaticamente
      ignoreExpiration: false,

      // Chave secreta para validação da assinatura JWT
      secretOrKey: jwtSecret,
    });

    this.logger.log(
      'JWT Strategy inicializada com validação de expiração habilitada'
    );
  }

  /**
   * Valida e processa o payload do token JWT
   *
   * Este método é chamado automaticamente pelo Passport quando um token
   * JWT válido é encontrado. É responsável por extrair e estruturar os
   * dados do usuário do payload do token.
   *
   * FLUXO DE VALIDAÇÃO:
   * 1. Recebe payload decodificado do JWT
   * 2. Extrai dados do usuário (id, matrícula, etc.)
   * 3. Estrutura dados para uso nos controladores
   * 4. Retorna dados do usuário autenticado
   *
   * @param payload - Payload decodificado do token JWT
   * @returns Dados estruturados do usuário autenticado
   *
   * @example
   * ```typescript
   * // Payload de entrada:
   * { sub: 123, matricula: 'user123', iat: 1640995200 }
   *
   * // Retorno:
   * { id: 123, sub: 123, matricula: 'user123', iat: 1640995200 }
   * ```
   */
  validate(payload: any) {
    this.logger.debug(`Validando payload JWT - sub: ${payload.sub}`);

    // Estruturar dados do usuário para uso nos controladores
    return {
      id: payload.sub, // ID do usuário (padrão JWT)
      ...payload, // Incluir todos os dados do payload
    };
  }
}
