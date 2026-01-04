/**
 * Hook para Gerenciamento de Range de Datas
 *
 * Este hook centraliza a lógica de gerenciamento de seleção de períodos,
 * fornecendo estado, formatação e validação.
 *
 * FUNCIONALIDADES:
 * - Gerencia estado de início e fim de período
 * - Fornece formatação para diferentes formatos
 * - Valida se o período é válido
 * - Suporta valores iniciais
 * - Integra com dayjs
 *
 * BENEFÍCIOS:
 * - Elimina código repetitivo de gerenciamento de datas
 * - Padroniza formatação de períodos
 * - Facilita validação de ranges
 *
 * EXEMPLO DE USO:
 * ```typescript
 * const dateRange = useDateRange({
 *   initialStart: dayjs(),
 *   initialEnd: dayjs().add(30, 'days')
 * });
 *
 * // No componente
 * <RangePicker
 *   value={[dateRange.start, dateRange.end]}
 *   onChange={dateRange.handleChange}
 * />
 * ```
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';

/**
 * Opções de configuração do hook
 */
export interface UseDateRangeOptions {
  /**
   * Data inicial padrão
   */
  initialStart?: Dayjs;

  /**
   * Data final padrão
   */
  initialEnd?: Dayjs;

  /**
   * Se deve inicializar com o dia de hoje
   * @default false
   */
  defaultToToday?: boolean;
}

/**
 * Retorno do hook
 */
export interface UseDateRangeReturn {
  /**
   * Data de início do período
   */
  start: Dayjs;

  /**
   * Data de fim do período
   */
  end: Dayjs;

  /**
   * Handler para mudança do range
   */
  handleChange: (dates: [Dayjs | null, Dayjs | null] | null) => void;

  /**
   * Define o range manualmente
   */
  setRange: (start: Dayjs, end: Dayjs) => void;

  /**
   * Reseta para valores iniciais
   */
  reset: () => void;

  /**
   * Formata o início como string ISO
   */
  startISO: string;

  /**
   * Formata o fim como string ISO
   */
  endISO: string;

  /**
   * Formata o início como Date
   */
  startDate: Date;

  /**
   * Formata o fim como Date
   */
  endDate: Date;

  /**
   * Verifica se o range é válido (início <= fim)
   */
  isValid: boolean;

  /**
   * Número de dias no período
   */
  daysCount: number;
}

/**
 * Hook para gerenciamento de range de datas
 *
 * @param options - Opções de configuração
 * @returns Objeto com estado e utilitários do range
 */
export function useDateRange(options: UseDateRangeOptions = {}): UseDateRangeReturn {
  const { initialStart, initialEnd, defaultToToday = false } = options;

  const getInitialStart = useCallback(() => {
    if (initialStart) return initialStart;
    if (defaultToToday) return dayjs().startOf('day');
    return dayjs().subtract(30, 'days').startOf('day');
  }, [initialStart, defaultToToday]);

  const getInitialEnd = useCallback(() => {
    if (initialEnd) return initialEnd;
    if (defaultToToday) return dayjs().endOf('day');
    return dayjs().endOf('day');
  }, [initialEnd, defaultToToday]);

  const [start, setStart] = useState<Dayjs>(getInitialStart);
  const [end, setEnd] = useState<Dayjs>(getInitialEnd);

  const handleChange = useCallback((dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setStart(dates[0].startOf('day'));
      setEnd(dates[1].endOf('day'));
    }
  }, []);

  const setRange = useCallback((newStart: Dayjs, newEnd: Dayjs) => {
    setStart(newStart.startOf('day'));
    setEnd(newEnd.endOf('day'));
  }, []);

  const reset = useCallback(() => {
    setStart(getInitialStart());
    setEnd(getInitialEnd());
  }, [getInitialStart, getInitialEnd]);

  return useMemo(
    () => ({
      start,
      end,
      handleChange,
      setRange,
      reset,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
      startDate: start.toDate(),
      endDate: end.toDate(),
      isValid: start.isBefore(end) || start.isSame(end),
      daysCount: end.diff(start, 'day') + 1,
    }),
    [start, end, handleChange, setRange, reset]
  );
}

