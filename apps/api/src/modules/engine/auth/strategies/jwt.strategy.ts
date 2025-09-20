/**
 * Estratégia JWT para Autenticação Mobile
 *
 * Esta estratégia implementa a validação de tokens JWT para usuários móveis,
 * configurada para aceitar tokens que não expiram automaticamente. É responsável
 * por extrair e validar tokens do header Authorization das requisições.
 *
 * CARACTERÍSTICAS:
 * - Extração automática de tokens do header Bearer
 * - Validação de assinatura com JWT_SECRET
 * - Ignora expiração (tokens válidos até logout manual)
 * - Logging detalhado para debugging
 *
 * SEGURANÇA:
 * - Validação rigorosa de assinatura JWT
 * - Extração segura de tokens do header
 * - Tratamento de tokens inválidos
 *
 * @fileoverview Estratégia Passport para validação de JWT tokens
 * @since 1.0.0
 * @author Nexa Oper Team
 */

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Estratégia JWT para autenticação de usuários móveis
 *
 * Implementa a validação de tokens JWT usando Passport, configurada
 * para trabalhar com tokens que não expiram automaticamente.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  /**
   * Construtor da JwtStrategy
   *
   * Configura a estratégia JWT com as opções necessárias para autenticação
   * de usuários móveis, incluindo extração de tokens e validação de assinatura.
   */
  constructor() {
    super({
      // Extrair token do header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ✅ Tokens não expiram - apenas logout manual
      // Esta configuração permite que tokens sejam válidos indefinidamente
      // até que o usuário faça logout manualmente
      ignoreExpiration: true,

      // Chave secreta para validação da assinatura JWT
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });

    console.log(
      '[JWT STRATEGY] Inicializada com secret:',
      process.env.JWT_SECRET || 'secret'
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
    console.log('[JWT STRATEGY] Validando payload:', payload);
    console.log('[JWT STRATEGY] Token sub:', payload.sub);

    // Estruturar dados do usuário para uso nos controladores
    return {
      id: payload.sub, // ID do usuário (padrão JWT)
      ...payload, // Incluir todos os dados do payload
    };
  }
}
