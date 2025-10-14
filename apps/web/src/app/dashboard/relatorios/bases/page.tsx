'use client';

import React, { useState } from 'react';
import { Button, Card, Col, Row, Select, Space, Typography } from 'antd';
import ConsolidacaoPorBase from './components/ConsolidacaoPorBase';
import ComparacaoEntreBases from './components/ComparacaoEntreBases';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';

const { Title } = Typography;

export default function RelatoriosBasesPage() {
  const [filtros, setFiltros] = useState({
    contratoId: undefined,
    baseId: undefined,
  });

  const { data: contratos, isLoading: loadingContratos } = useEntityData({
    key: 'relatorios-bases-contratos',
    fetcher: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases } = useEntityData({
    key: 'relatorios-bases-bases',
    fetcher: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFiltros({
      contratoId: undefined,
      baseId: undefined,
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Bases</Title>

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size='middle'>
          <Select
            placeholder='Filtrar por Contrato'
            style={{ width: 250 }}
            allowClear
            loading={loadingContratos}
            value={filtros.contratoId}
            onChange={(value) => handleFilterChange('contratoId', value)}
            options={contratos?.map((c: any) => ({ label: c.nome, value: c.id }))}
          />
          <Select
            placeholder='Filtrar por Base'
            style={{ width: 250 }}
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
        <Col xs={24}>
          <ConsolidacaoPorBase filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <ComparacaoEntreBases filtros={filtros} />
        </Col>
      </Row>
    </div>
  );
}
