/**
 * Utilitários para manipulação de datas
 *
 * Centraliza funções comuns de manipulação de datas
 * para evitar duplicação de código.
 */

const TIMEZONE_SAO_PAULO = 'America/Sao_Paulo';

/**
 * Retorna o intervalo de datas do dia atual no timezone de São Paulo (início e fim do dia)
 *
 * @returns Objeto com início e fim do dia atual em São Paulo (00:00:00 até 23:59:59.999)
 */
export function getTodayDateRange(): { inicio: Date; fim: Date } {
  const agora = new Date();

  return getDateRangeInSaoPaulo(agora);
}

/**
 * Retorna o intervalo de datas de um dia no timezone de São Paulo (início e fim)
 *
 * @param date - Data base
 * @returns Objeto com início e fim do dia em São Paulo
 */
export function getDateRangeInSaoPaulo(date: Date): { inicio: Date; fim: Date } {
  // Obter data atual no timezone de São Paulo (formato YYYY-MM-DD)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_SAO_PAULO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Formatar data como YYYY-MM-DD no timezone de São Paulo
  const dataStr = formatter.format(date);

  // Criar início do dia (00:00:00) no timezone de São Paulo
  // Brasil usa GMT-3 (não usa mais horário de verão desde 2019)
  const inicioStr = `${dataStr}T00:00:00-03:00`;
  const inicio = new Date(inicioStr);

  // Criar fim do dia (23:59:59.999) no timezone de São Paulo
  const fimStr = `${dataStr}T23:59:59.999-03:00`;
  const fim = new Date(fimStr);

  return { inicio, fim };
}

/**
 * Extrai a hora (0-23) de uma data no timezone de São Paulo
 *
 * @param date - Data a partir da qual extrair a hora
 * @returns Hora no formato 0-23
 */
export function getHoursInSaoPaulo(date: Date): number {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE_SAO_PAULO,
    hour: '2-digit',
    hour12: false,
  });

  const partes = formatter.formatToParts(date);
  return parseInt(partes.find(p => p.type === 'hour')?.value || '0', 10);
}

/**
 * Extrai os minutos (0-59) de uma data no timezone de São Paulo
 *
 * @param date - Data a partir da qual extrair os minutos
 * @returns Minutos no formato 0-59
 */
export function getMinutesInSaoPaulo(date: Date): number {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIMEZONE_SAO_PAULO,
    minute: '2-digit',
  });

  const partes = formatter.formatToParts(date);
  return parseInt(partes.find(p => p.type === 'minute')?.value || '0', 10);
}
