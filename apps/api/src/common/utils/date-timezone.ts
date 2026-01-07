/**
 * Utilitários para conversão de datas com timezone
 *
 * Este módulo resolve problemas de timezone entre app mobile e API,
 * garantindo que as datas sejam interpretadas corretamente.
 */

const TIMEZONE_SAO_PAULO = 'America/Sao_Paulo';
const SAO_PAULO_OFFSET = '-03:00';
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Converte uma string de data do app mobile para Date
 *
 * O app mobile envia datas no formato ISO sem timezone explícito,
 * mas essas datas devem ser interpretadas como UTC para consistência.
 *
 * @param dateString - String de data do app (ex: "2025-10-22T21:39:50.334880")
 * @returns Date object em UTC
 */
export function parseMobileDate(dateString: string): Date {
  // Se a string não tem timezone, assumir UTC
  if (
    !dateString.includes('Z') &&
    !dateString.includes('+') &&
    !dateString.includes('-', 10)
  ) {
    // Adicionar 'Z' para indicar UTC se não tiver timezone
    dateString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
  }

  return new Date(dateString);
}

/**
 * Converte uma string de data para Date, respeitando data-only como dia local de São Paulo
 *
 * @param dateString - String de data (YYYY-MM-DD ou ISO completo)
 * @returns Date object com timezone consistente
 */
export function parseDateInput(dateString: string): Date {
  if (DATE_ONLY_REGEX.test(dateString)) {
    return new Date(`${dateString}T00:00:00${SAO_PAULO_OFFSET}`);
  }

  return parseMobileDate(dateString);
}

/**
 * Formata uma data como YYYY-MM-DD no timezone de São Paulo
 *
 * @param date - Date object
 * @returns String YYYY-MM-DD
 */
export function formatDateOnly(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_SAO_PAULO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

/**
 * Retorna o intervalo do dia (início e fim) no timezone de São Paulo
 *
 * @param date - Date base
 * @returns Intervalo do dia
 */
export function getSaoPauloDayRange(date: Date): { start: Date; end: Date } {
  const dateStr = formatDateOnly(date);
  return {
    start: new Date(`${dateStr}T00:00:00${SAO_PAULO_OFFSET}`),
    end: new Date(`${dateStr}T23:59:59.999${SAO_PAULO_OFFSET}`),
  };
}

/**
 * Converte uma string de data do app mobile para Date (timezone local)
 *
 * Para casos onde a data do app deve ser interpretada como timezone local
 * do servidor (não recomendado para produção).
 *
 * @param dateString - String de data do app
 * @returns Date object em timezone local
 */
export function parseMobileDateLocal(dateString: string): Date {
  // Remover 'Z' se existir para forçar interpretação local
  const localDateString = dateString.replace('Z', '');
  return new Date(localDateString);
}

/**
 * Converte Date para string ISO UTC
 *
 * @param date - Date object
 * @returns String ISO em UTC
 */
export function toISOStringUTC(date: Date): string {
  return date.toISOString();
}

/**
 * Converte Date para string ISO local
 *
 * @param date - Date object
 * @returns String ISO em timezone local
 */
export function toISOStringLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, -1);
}

/**
 * Valida se uma string de data é válida
 *
 * @param dateString - String de data
 * @returns true se válida, false caso contrário
 */
export function isValidDateString(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Obtém o timezone atual do servidor
 *
 * @returns String do timezone (ex: "America/Sao_Paulo")
 */
export function getServerTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Obtém o offset de timezone atual em minutos
 *
 * @returns Offset em minutos (positivo para oeste, negativo para leste)
 */
export function getTimezoneOffset(): number {
  return new Date().getTimezoneOffset();
}
