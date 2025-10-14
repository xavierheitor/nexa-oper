'use client';

import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import VeiculosPorTipo from './components/VeiculosPorTipo';
import VeiculosPorLotacao from './components/VeiculosPorLotacao';
import VeiculosPorMarca from './components/VeiculosPorMarca';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function RelatoriosVeiculosPage() {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    contratoId: undefined,
    baseId: undefined,
  });

  const { data: contratos, isLoading: loadingContratos } = useEntityData({
    key: 'relatorios-veiculos-contratos',
    fetcher: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases } = useEntityData({
    key: 'relatorios-veiculos-bases',
    fetcher: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const handleFilterChange = (key: string, value: any) => {
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
      setFiltros((prev) => ({ ...prev, periodoInicio: undefined, periodoFim: undefined }));
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Veículos</Title>

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
            options={contratos?.map((c: any) => ({ label: c.nome, value: c.id }))}
          />
          <Select
            placeholder='Filtrar por Base'
            style={{ width: 200 }}
            allowClear
            loading={loadingBases}
            value={filtros.baseId}
            onChange={(value) => handleFilterChange('baseId', value)}
            options={bases?.map((b: any) => ({ label: b.nome, value: b.id }))}
          />
          <Button onClick={handleClearFilters}>Limpar Filtros</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <VeiculosPorTipo filtros={filtros} />
        </Col>
        <Col xs={24} lg={12}>
          <VeiculosPorLotacao filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <VeiculosPorMarca filtros={filtros} />
        </Col>
      </Row>
    </div>
  );
}
