'use client';

import { Select, DatePicker, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { PeriodoTipo, PeriodoTipoLabels } from '@/lib/schemas/turnoRealizadoSchema';

const { RangePicker } = DatePicker;

export interface PeriodoSelectorProps {
  value?: {
    periodo: PeriodoTipo;
    dataInicio?: Date;
    dataFim?: Date;
  };
  onChange?: (value: {
    periodo: PeriodoTipo;
    dataInicio?: Date;
    dataFim?: Date;
  }) => void;
  showCustom?: boolean;
}

/**
 * Componente para seleção de período
 * Permite escolher entre mês atual, trimestre ou período customizado
 */
export default function PeriodoSelector({
  value,
  onChange,
  showCustom = true,
}: PeriodoSelectorProps) {
  const periodo = value?.periodo || 'mes';
  const dataInicio = value?.dataInicio ? dayjs(value.dataInicio) : undefined;
  const dataFim = value?.dataFim ? dayjs(value.dataFim) : undefined;

  const handlePeriodoChange = (novoPeriodo: PeriodoTipo) => {
    if (novoPeriodo === 'mes') {
      const agora = new Date();
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59, 999);
      onChange?.({
        periodo: novoPeriodo,
        dataInicio: inicio,
        dataFim: fim,
      });
    } else if (novoPeriodo === 'trimestre') {
      const agora = new Date();
      const trimestre = Math.floor(agora.getMonth() / 3);
      const inicio = new Date(agora.getFullYear(), trimestre * 3, 1);
      const fim = new Date(agora.getFullYear(), (trimestre + 1) * 3, 0, 23, 59, 59, 999);
      onChange?.({
        periodo: novoPeriodo,
        dataInicio: inicio,
        dataFim: fim,
      });
    } else {
      // Custom - mantém datas existentes ou permite seleção
      onChange?.({
        periodo: novoPeriodo,
        dataInicio: value?.dataInicio,
        dataFim: value?.dataFim,
      });
    }
  };

  const handleRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      onChange?.({
        periodo: 'custom',
        dataInicio: dates[0].toDate(),
        dataFim: dates[1].toDate(),
      });
    }
  };

  return (
    <Space>
      <Select
        value={periodo}
        onChange={handlePeriodoChange}
        style={{ width: 180 }}
        options={Object.entries(PeriodoTipoLabels)
          .filter(([key]) => showCustom || key !== 'custom')
          .map(([value, label]) => ({ value, label }))}
      />
      {periodo === 'custom' && (
        <RangePicker
          value={dataInicio && dataFim ? [dataInicio, dataFim] : null}
          onChange={handleRangeChange}
          format="DD/MM/YYYY"
          placeholder={['Data início', 'Data fim']}
        />
      )}
    </Space>
  );
}

