import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

type Key = string;

interface Counter {
  count: number;
  expiresAt: number; // epoch ms
}

/**
 * Middleware simples de rate limiting em memória.
 *
 * - Limita por IP e por chave adicional (ex.: matrícula no login)
 * - Janela deslizante simples baseada em TTL
 * - Sem dependências externas
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private static readonly ipCounters: Map<Key, Counter> = new Map();
  private static readonly userCounters: Map<Key, Counter> = new Map();

  // Configurações parametrizáveis via ENV com defaults seguros
  private static get WINDOW_MS(): number {
    const raw = process.env.RATE_LIMIT_WINDOW_MS;
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 60_000; // default 1 min
  }

  private static get MAX_ATTEMPTS_PER_IP(): number {
    const raw = process.env.RATE_LIMIT_MAX_PER_IP;
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20; // default por janela
  }

  private static get MAX_ATTEMPTS_PER_USER(): number {
    const raw = process.env.RATE_LIMIT_MAX_PER_USER;
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5; // default por janela
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now();
    const ip = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      '') as string;

    // Chave do usuário (quando disponível). Para login, tentamos usar matrícula
    const body: any = req.body ?? {};
    const username =
      typeof body.matricula === 'string' ? body.matricula : undefined;

    // Verificação por IP
    const ipKey = `ip:${ip}`;
    const ipCounter = RateLimitMiddleware.getAndUpdateCounter(
      RateLimitMiddleware.ipCounters,
      ipKey,
      now,
      RateLimitMiddleware.WINDOW_MS
    );

    if (ipCounter.count > RateLimitMiddleware.MAX_ATTEMPTS_PER_IP) {
      res.setHeader(
        'Retry-After',
        Math.ceil((ipCounter.expiresAt - now) / 1000)
      );
      throw new BadRequestException(
        'Muitas requisições deste IP. Tente novamente em instantes.'
      );
    }

    // Verificação por usuário (quando houver)
    if (username) {
      const userKey = `user:${username.toLowerCase()}`;
      const userCounter = RateLimitMiddleware.getAndUpdateCounter(
        RateLimitMiddleware.userCounters,
        userKey,
        now,
        RateLimitMiddleware.WINDOW_MS
      );

      if (userCounter.count > RateLimitMiddleware.MAX_ATTEMPTS_PER_USER) {
        res.setHeader(
          'Retry-After',
          Math.ceil((userCounter.expiresAt - now) / 1000)
        );
        throw new BadRequestException(
          'Muitas tentativas para este usuário. Tente novamente em instantes.'
        );
      }
    }

    next();
  }

  private static getAndUpdateCounter(
    map: Map<Key, Counter>,
    key: Key,
    now: number,
    windowMs: number
  ): Counter {
    const current = map.get(key);
    if (!current || current.expiresAt <= now) {
      const fresh: Counter = { count: 1, expiresAt: now + windowMs };
      map.set(key, fresh);
      return fresh;
    }
    current.count += 1;
    return current;
  }
}
