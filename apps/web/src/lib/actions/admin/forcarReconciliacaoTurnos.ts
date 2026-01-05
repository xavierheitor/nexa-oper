/**
 * Server Action para Forçar Reconciliação de Turnos
 *
 * Chama o endpoint interno da API para executar reconciliação de turnos.
 * Executa apenas no servidor (server-side).
 */

'use server';

import { z } from 'zod';

const forcarReconciliacaoSchema = z.object({
  dataReferencia: z.string().optional(), // YYYY-MM-DD
  equipeId: z.number().optional(),
  intervaloDias: z.number().optional().default(1),
  dryRun: z.boolean().optional().default(false),
});

export interface ForcarReconciliacaoParams {
  dataReferencia?: string;
  equipeId?: number;
  intervaloDias?: number;
  dryRun?: boolean;
}

export interface ForcarReconciliacaoResult {
  success: boolean;
  runId?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  stats?: {
    created: number;
    updated: number;
    closed: number;
    skipped: number;
  };
  warnings?: string[];
  error?: string;
}

/**
 * Força execução de reconciliação de turnos via API interna
 */
export async function forcarReconciliacaoTurnos(
  params: ForcarReconciliacaoParams
): Promise<ForcarReconciliacaoResult> {
  try {
    // Validar parâmetros
    const validated = forcarReconciliacaoSchema.parse(params);

    // URL da API (usar variável de ambiente ou padrão)
    const apiPort = process.env.API_PORT || '3001';
    const apiUrl = `http://127.0.0.1:${apiPort}/api/internal/reconciliacao/turnos`;

    // Chave interna (obrigatória)
    const internalKey = process.env.INTERNAL_KEY;
    if (!internalKey) {
      return {
        success: false,
        error: 'INTERNAL_KEY não configurada no servidor',
      };
    }

    // Fazer requisição para API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': internalKey,
      },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Erro ${response.status}: ${errorText}`,
      };
    }

    const resultado = await response.json();
    return {
      success: true,
      ...resultado,
    };
  } catch (error) {
    console.error('[Forçar Reconciliação] Erro:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
