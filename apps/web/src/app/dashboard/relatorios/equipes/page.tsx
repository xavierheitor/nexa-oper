'use client';

import React, { useState, useMemo } from 'react';
import { Button, Card, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import EquipesEscaladas from './components/EquipesEscaladas';
import EquipesPorHorario from './components/EquipesPorHorario';
import EquipesSemHorario from './components/EquipesSemHorario';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import type { Contrato, Base } from '@nexa-oper/db';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function RelatoriosEquipesPage() {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    contratoId: undefined,
    baseId: undefined,
  });

  const { data: contratos, isLoading: loadingContratos, error: errorContratos, mutate: refetchContratos } = useEntityData({
    key: 'relatorios-equipes-contratos',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases, error: errorBases, mutate: refetchBases } = useEntityData({
    key: 'relatorios-equipes-bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const handleFilterChange = (key: string, value: number | undefined) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handlePeriodChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setFiltros((prev) => ({
        ...prev,
        periodoInicio: dates[0].startOf('day').toDate(),
        periodoFim: dates[1].endOf('day').toDate(),
      }));
    } else {
      // Resetar para valores padrão quando não houver datas selecionadas
      setFiltros((prev) => ({
        ...prev,
        periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
        periodoFim: dayjs().endOf('day').toDate(),
      }));
    }
  };

  const handleClearFilters = () => {
    setFiltros({
      periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
      periodoFim: dayjs().endOf('day').toDate(),
      contratoId: undefined,
      baseId: undefined,
    });
  };

  // Memoiza as opções dos Selects para evitar recriações desnecessárias
  const contratosOptions = useMemo(
    () => contratos?.map((c: Contrato) => ({ label: c.nome, value: c.id })) || [],
    [contratos]
  );

  const basesOptions = useMemo(
    () => bases?.map((b: Base) => ({ label: b.nome, value: b.id })) || [],
    [bases]
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Equipes</Title>

      {/* Tratamento de Erros */}
      <ErrorAlert error={errorContratos?.message} onRetry={refetchContratos} />
      <ErrorAlert error={errorBases?.message} onRetry={refetchBases} />

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
            placeholder={['Data Início', 'Data Fim']}
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <EquipesEscaladas filtros={filtros} />
        </Col>
        <Col xs={24} lg={12}>
          <EquipesPorHorario filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <EquipesSemHorario filtros={filtros} />
        </Col>
      </Row>
    </div>
  );
}
