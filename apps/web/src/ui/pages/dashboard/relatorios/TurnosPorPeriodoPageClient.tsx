'use client';

import React, { useState } from 'react';
import { Button, Card, DatePicker, Select, Space, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import TurnosPorPeriodo from '@/ui/pages/dashboard/relatorios/turnos-por-periodo/components/TurnosPorPeriodo';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';
import type { Base, Contrato } from '@nexa-oper/db';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface TurnosPorPeriodoPageClientProps {
  initialContratos?: Contrato[];
  initialBases?: Base[];
}

function errorToString(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

export default function TurnosPorPeriodoPageClient({
  initialContratos = [],
  initialBases = [],
}: TurnosPorPeriodoPageClientProps) {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().startOf('month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    contratoId: undefined as number | undefined,
    baseId: undefined as number | undefined,
  });

  const {
    data: contratos,
    isLoading: loadingContratos,
    error: errorContratos,
    mutate: refetchContratos,
  } = useEntityData({
    key: 'turnos-por-periodo-contratos',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const {
    data: bases,
    isLoading: loadingBases,
    error: errorBases,
    mutate: refetchBases,
  } = useEntityData({
    key: 'turnos-por-periodo-bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialData: initialBases,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const handleFilterChange = (key: string, value: number | undefined) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handlePeriodChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      const [start, end] = dates;
      if (start && end) {
        setFiltros((prev) => ({
          ...prev,
          periodoInicio: start.startOf('day').toDate(),
          periodoFim: end.endOf('day').toDate(),
        }));
      }
    } else {
      setFiltros((prev) => ({
        ...prev,
        periodoInicio: dayjs().startOf('month').startOf('day').toDate(),
        periodoFim: dayjs().endOf('day').toDate(),
      }));
    }
  };

  const handleClearFilters = () => {
    setFiltros({
      periodoInicio: dayjs().startOf('month').startOf('day').toDate(),
      periodoFim: dayjs().endOf('day').toDate(),
      contratoId: undefined,
      baseId: undefined,
    });
  };

  const contratosOptions = useSelectOptions(contratos, { labelKey: 'nome', valueKey: 'id' });
  const basesOptions = useSelectOptions(bases, { labelKey: 'nome', valueKey: 'id' });

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatorio - Turnos por Periodo</Title>

      <ErrorAlert error={errorToString(errorContratos)} onRetry={refetchContratos} />
      <ErrorAlert error={errorToString(errorBases)} onRetry={refetchBases} />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size='middle'>
          <RangePicker
            value={
              filtros.periodoInicio && filtros.periodoFim
                ? [dayjs(filtros.periodoInicio), dayjs(filtros.periodoFim)]
                : undefined
            }
            onChange={handlePeriodChange}
            format='DD/MM/YYYY'
            placeholder={['Data Inicio', 'Data Fim']}
          />
          <Select
            placeholder='Filtrar por Contrato'
            style={{ width: 200 }}
            allowClear
            loading={loadingContratos}
            value={filtros.contratoId}
            onChange={(value) => handleFilterChange('contratoId', value)}
            options={contratosOptions}
          />
          <Select
            placeholder='Filtrar por Base'
            style={{ width: 200 }}
            allowClear
            loading={loadingBases}
            value={filtros.baseId}
            onChange={(value) => handleFilterChange('baseId', value)}
            options={basesOptions}
          />
          <Button onClick={handleClearFilters}>Limpar Filtros</Button>
        </Space>
      </Card>

      <TurnosPorPeriodo
        filtros={{
          periodoInicio: filtros.periodoInicio,
          periodoFim: filtros.periodoFim,
          baseId: filtros.baseId,
          contratoId: filtros.contratoId,
        }}
      />
    </div>
  );
}
