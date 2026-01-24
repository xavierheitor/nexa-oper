/**
 * Utilitários para parâmetros de sincronização
 *
 * Funções compartilhadas entre controllers de sync que aceitam
 * parâmetros como since (ISO 8601) para sincronização incremental.
 */

import { BadRequestException } from '@nestjs/common';

/**
 * Valida o parâmetro since (ISO 8601). Se presente e inválido, lança BadRequestException.
 *
 * @param since - String opcional no formato ISO 8601 (ex: 2024-01-15T00:00:00.000Z)
 * @returns since se válido, undefined se ausente
 * @throws BadRequestException se since for uma string não vazia e não for data ISO 8601 válida
 */
export function validateSince(since?: string): string | undefined {
  if (!since) return undefined;
  const t = new Date(since).getTime();
  if (Number.isNaN(t)) {
    throw new BadRequestException(
      'O parâmetro since deve ser uma data em formato ISO 8601 (ex: 2024-01-15T00:00:00.000Z)',
    );
  }
  return since;
}
