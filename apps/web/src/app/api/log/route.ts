// src/app/api/log/route.ts

import { logger } from '@/lib/utils/logger';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type = 'info', message, meta } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    switch (type) {
      case 'info':
        logger.info(message, meta);
        break;
      case 'warn':
        logger.warn(message, meta);
        break;
      case 'error':
        logger.error(message, meta);
        break;
      case 'action':
        logger.action(message, meta);
        break;
      case 'access':
        logger.access(message, meta);
        break;
      default:
        logger.info(message, meta);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erro ao registrar log pela API', { error });
    return NextResponse.json({ error: 'Erro interno ao registrar log' }, { status: 500 });
  }
}
