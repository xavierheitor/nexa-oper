'use client';

import React, { useState, useMemo } from 'react';
import { Button, Card, Col, DatePicker, Row, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import EquipesMenosLocalizacoes from './components/EquipesMenosLocalizacoes';
import EquipesMaiorTempoSemCaptura from './components/EquipesMaiorTempoSemCaptura';

const { RangePicker } = DatePicker;
const { Title } = Typography;

/**
 * Converte erro unknown para string | null para uso com ErrorAlert
 */
function errorToString(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return String(error);
}

export default function RelatoriosLocalizacaoPage() {
  const [filtros, setFiltros] = useState({
    periodoInicio: dayjs().subtract(1, 'month').startOf('day').toDate(),
    periodoFim: dayjs().endOf('day').toDate(),
    tipoEquipeId: undefined as number | undefined,
    baseId: undefined as number | undefined,
  });

  const { data: tiposEquipe, isLoading: loadingTiposEquipe, error: errorTiposEquipe, mutate: refetchTiposEquipe } = useEntityData({
    key: 'relatorios-localizacao-tipos-equipe',
    fetcherAction: unwrapFetcher(listTiposEquipe),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases, error: errorBases, mutate: refetchBases } = useEntityData({
    key: 'relatorios-localizacao-bases',
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
      tipoEquipeId: undefined,
      baseId: undefined,
    });
  };

  // Memoiza as opções dos Selects para evitar recriações desnecessárias
  const tiposEquipeOptions = useMemo(
    () => tiposEquipe?.map((t: any) => ({ label: t.nome, value: t.id })) || [],
    [tiposEquipe]
  );

  const basesOptions = useMemo(
    () => bases?.map((b: any) => ({ label: b.nome, value: b.id })) || [],
    [bases]
  );

  // Memoiza os filtros para evitar recriações desnecessárias
  const filtrosMemoizados = useMemo(() => filtros, [filtros]);

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Localização</Title>

      {/* Tratamento de Erros */}
      <ErrorAlert error={errorToString(errorTiposEquipe)} onRetry={refetchTiposEquipe} />
      <ErrorAlert error={errorToString(errorBases)} onRetry={refetchBases} />

      <Card style={{ marginBottom: 24 }}>
        <Space wrap size="middle">
          <RangePicker
            value={
              filtros.periodoInicio && filtros.periodoFim
                ? [dayjs(filtros.periodoInicio), dayjs(filtros.periodoFim)]
                : undefined
            }
            onChange={handlePeriodChange}
            format="DD/MM/YYYY"
            placeholder={['Data Início', 'Data Fim']}
          />
          <Select
            placeholder="Filtrar por Tipo de Equipe"
            style={{ width: 250 }}
            allowClear
            loading={loadingTiposEquipe}
            value={filtros.tipoEquipeId}
            onChange={(value) => handleFilterChange('tipoEquipeId', value)}
            options={tiposEquipeOptions}
          />
          <Select
            placeholder="Filtrar por Base"
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
        <Col xs={24}>
          <EquipesMenosLocalizacoes filtros={filtrosMemoizados} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <EquipesMaiorTempoSemCaptura filtros={filtrosMemoizados} />
        </Col>
      </Row>
    </div>
  );
}

