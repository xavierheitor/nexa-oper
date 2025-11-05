'use client';

import React, { useState, useMemo } from 'react';
import { Button, Card, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import EletricistasPorLotacao from './components/EletricistasPorLotacao';
import EletricistasPorTipoEquipe from './components/EletricistasPorTipoEquipe';
import EletricistasDetalhado from './components/EletricistasDetalhado';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function RelatoriosEletricistasPage() {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    contratoId: undefined,
    baseId: undefined,
  });

  const { data: contratos, isLoading: loadingContratos } = useEntityData({
    key: 'relatorios-eletricistas-contratos',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases } = useEntityData({
    key: 'relatorios-eletricistas-bases',
    fetcherAction: unwrapFetcher(listBases),
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
    () => contratos?.map((c: any) => ({ label: c.nome, value: c.id })) || [],
    [contratos]
  );

  const basesOptions = useMemo(
    () => bases?.map((b: any) => ({ label: b.nome, value: b.id })) || [],
    [bases]
  );

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Eletricistas</Title>

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
          <EletricistasPorLotacao filtros={filtros} />
        </Col>
        <Col xs={24} lg={12}>
          <EletricistasPorTipoEquipe filtros={filtros} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <EletricistasDetalhado filtros={filtros} />
        </Col>
      </Row>
    </div>
  );
}
