'use client';

import React, { useMemo, useCallback } from 'react';
import { Card, Col, Row, Spin, Typography } from 'antd';
import ConsolidacaoPorBase from '@/ui/pages/dashboard/relatorios/bases/components/ConsolidacaoPorBase';
import ComparacaoEntreBases from '@/ui/pages/dashboard/relatorios/bases/components/ComparacaoEntreBases';
import EletricistasNaoEscalados from '@/ui/pages/dashboard/relatorios/bases/components/EletricistasNaoEscalados';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { unwrapFetcher } from '@/lib/db/helpers/unwrapFetcher';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';
import { useTableFilters } from '@/lib/hooks/useTableFilters';
import FilterBar from '@/ui/components/FilterBar';
import { listBases } from '@/lib/actions/base/list';
import { listContratos } from '@/lib/actions/contrato/list';

const { Title } = Typography;

export default function RelatoriosBasesPage() {
  const { filters, handleFilterChange, clearFilters } = useTableFilters<{
    contratoId: number | undefined;
    baseId: number | undefined;
  }>({
    contratoId: undefined,
    baseId: undefined,
  });

  const { data: contratos, isLoading: loadingContratos } = useEntityData({
    key: 'relatorios-bases-contratos',
    fetcherAction: unwrapFetcher(listContratos),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  const { data: bases, isLoading: loadingBases } = useEntityData({
    key: 'relatorios-bases-bases',
    fetcherAction: unwrapFetcher(listBases),
    paginationEnabled: false,
    initialParams: { page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' },
  });

  // Transforma dados em opções de Select usando hook reutilizável
  const contratosOptions = useSelectOptions(contratos, { labelKey: 'nome', valueKey: 'id' });
  const basesOptions = useSelectOptions(bases, { labelKey: 'nome', valueKey: 'id' });

  // Memoiza o objeto filtros para evitar recriações desnecessárias
  const filtrosMemoizados = useMemo(() => filters, [filters]);

  // Wrapper para converter o tipo do FilterBar para o tipo esperado pelo useTableFilters
  const handleFilterBarChange = useCallback((key: string, value: unknown) => {
    if (key === 'contratoId' || key === 'baseId') {
      handleFilterChange(key as 'contratoId' | 'baseId', value as number | undefined);
    }
  }, [handleFilterChange]);

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Relatórios - Bases</Title>

      <Card style={{ marginBottom: 24 }}>
        <FilterBar
          filters={[
            {
              type: 'select',
              key: 'contratoId',
              placeholder: 'Filtrar por Contrato',
              options: contratosOptions,
              loading: loadingContratos,
              width: 250,
            },
            {
              type: 'select',
              key: 'baseId',
              placeholder: 'Filtrar por Base',
              options: basesOptions,
              loading: loadingBases,
              width: 250,
            },
          ]}
          values={filters}
          onChange={handleFilterBarChange}
          onClear={clearFilters}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <ConsolidacaoPorBase filtros={filtrosMemoizados} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <ComparacaoEntreBases filtros={filtrosMemoizados} />
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <EletricistasNaoEscalados filtros={filtrosMemoizados} />
        </Col>
      </Row>
    </div>
  );
}
