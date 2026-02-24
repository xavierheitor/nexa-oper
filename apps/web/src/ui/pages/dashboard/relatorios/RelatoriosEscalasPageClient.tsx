'use client';

import React, { useState, useMemo } from 'react';
import { Button, Card, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import DiasTrabalhadosPorEletricista from '@/app/dashboard/relatorios/escalas/components/DiasTrabalhadosPorEletricista';
import FaltasPorPeriodo from '@/app/dashboard/relatorios/escalas/components/FaltasPorPeriodo';
import ComparacaoFolgaTrabalho from '@/app/dashboard/relatorios/escalas/components/ComparacaoFolgaTrabalho';
import EscaladosPorDia from '@/app/dashboard/relatorios/escalas/components/EscaladosPorDia';
import TurnosPorPeriodo from '@/app/dashboard/relatorios/turnos-por-periodo/components/TurnosPorPeriodo';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';
import type { Base, Contrato } from '@nexa-oper/db';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface RelatoriosEscalasPageClientProps {
  initialContratos?: Contrato[];
  initialBases?: Base[];
}

export default function RelatoriosEscalasPageClient({
  initialContratos = [],
  initialBases = [],
}: RelatoriosEscalasPageClientProps) {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    contratoId: undefined as number | undefined,
    baseId: undefined as number | undefined,
  });

  const { data: contratos, isLoading: loadingContratos } = useEntityData({
    key: 'relatorios-escalas-contratos',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialData: initialContratos,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases } = useEntityData({
    key: 'relatorios-escalas-bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialData: initialBases,
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
      <Title level={2}>Relatorios - Escalas</Title>

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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <ComparacaoFolgaTrabalho filtros={filtros} />
        </Col>
        <Col xs={24} lg={12}>
          <FaltasPorPeriodo filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <DiasTrabalhadosPorEletricista filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <EscaladosPorDia
            filtros={{
              baseId: filtros.baseId,
              contratoId: filtros.contratoId,
            }}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <TurnosPorPeriodo
            filtros={{
              periodoInicio: filtros.periodoInicio,
              periodoFim: filtros.periodoFim,
              baseId: filtros.baseId,
              contratoId: filtros.contratoId,
            }}
          />
        </Col>
      </Row>
    </div>
  );
}
