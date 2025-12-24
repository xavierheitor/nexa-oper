/**
 * Funções auxiliares para cálculo de turnos previstos
 */

/**
 * Converte uma string de horário "HH:MM:SS" para um objeto Date
 * usando uma data base como referência
 *
 * @param time - String no formato "HH:MM:SS"
 * @param baseDate - Data base para construir o Date completo
 * @returns Date com horário definido
 */
export function parseTimeToDate(time: string, baseDate: Date): Date {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, seconds || 0, 0);
  return date;
}

/**
 * Calcula a diferença em minutos entre duas datas
 *
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns Diferença em minutos (valor absoluto)
 */
export function calculateMinutesDifference(
  date1: Date,
  date2: Date
): number {
  return Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60));
}

/**
 * Formata uma string de horário "HH:MM:SS" para exibição "HH:MM"
 *
 * @param time - String no formato "HH:MM:SS"
 * @returns String formatada "HH:MM"
 */
export function formatTime(time: string | null): string {
  if (!time) return '-';
  return time.substring(0, 5); // "HH:MM:SS" -> "HH:MM"
}

/**
 * Verifica se um horário está dentro da janela de aderência (±30 minutos)
 *
 * @param horarioAbertura - Horário em que o turno foi aberto
 * @param horarioPrevisto - Horário previsto da escala
 * @returns true se está dentro da janela de ±30 minutos
 */
export function isAderente(
  horarioAbertura: Date,
  horarioPrevisto: Date
): boolean {
  const diferencaMinutos = calculateMinutesDifference(
    horarioAbertura,
    horarioPrevisto
  );
  return diferencaMinutos <= 30;
}

