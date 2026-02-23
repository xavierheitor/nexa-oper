import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@nexa-oper/db';
import { env } from '../core/config/env';

function isOffsetTz(value: string): boolean {
  return /^[+-]\d{2}:\d{2}$/.test(value);
}

function offsetFromIanaTimeZone(value: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: value,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (!tzPart) return null;
    if (tzPart === 'GMT' || tzPart === 'UTC') return '+00:00';
    const match = /^GMT([+-]\d{2}:\d{2})$/.exec(tzPart);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function sqlStringLiteral(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function buildDbTimeZoneCandidates(): string[] {
  const values = new Set<string>();
  const configured = env.DATABASE_TIME_ZONE?.trim();
  if (configured) values.add(configured);

  const appTz = env.TZ.trim();
  if (appTz.toUpperCase() === 'UTC') {
    values.add('+00:00');
  } else if (isOffsetTz(appTz)) {
    values.add(appTz);
  } else {
    // Prioriza offset para evitar erro em MySQL sem tabelas de timezone carregadas.
    const offset = offsetFromIanaTimeZone(appTz);
    if (offset) values.add(offset);
    // Alguns MySQL aceitam timezone nomeada; mantemos como fallback.
    values.add(appTz);
  }

  values.add('+00:00');
  return [...values];
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: [{ emit: 'stdout', level: 'error' }],
    });
  }

  async onModuleInit() {
    await this.$connect();

    for (const timeZone of buildDbTimeZoneCandidates()) {
      try {
        await this.$executeRawUnsafe(
          `SET time_zone = ${sqlStringLiteral(timeZone)}`,
        );
        break;
      } catch {
        // tenta próximo candidato
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRawUnsafe('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
