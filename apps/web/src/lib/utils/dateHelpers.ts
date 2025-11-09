/**
 * Utilitários para manipulação de datas
 *
 * Centraliza funções comuns de manipulação de datas
 * para evitar duplicação de código.
 */

/**
 * Retorna o intervalo de datas do dia atual (início e fim do dia)
 *
 * @returns Objeto com início e fim do dia atual (00:00:00 até 23:59:59)
 */
export function getTodayDateRange(): { inicio: Date; fim: Date } {
  const hoje = new Date();
  const inicio = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
    0,
    0,
    0
  );
  const fim = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
    23,
    59,
    59
  );
  return { inicio, fim };
}

