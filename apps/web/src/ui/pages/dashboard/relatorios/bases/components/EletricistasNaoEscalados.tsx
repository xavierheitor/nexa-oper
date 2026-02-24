'use client';

import { Button, Card, Empty, Space, Spin, Table, Tag } from 'antd';
import { useMemo } from 'react';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import {
  StatusEletricistaColors,
  StatusEletricistaLabels,
  type StatusEletricista,
} from '@/lib/schemas/eletricistaStatusSchema';
import type { FiltrosRelatorioBase } from '@/ui/pages/dashboard/relatorios/types';

interface EletricistaNaoEscalado {
  eletricistaId: number;
  nome: string;
  matricula: string;
  baseId: number;
  baseNome: string;
  contratoNome: string;
  status: StatusEletricista;
  statusMotivo: string | null;
}

interface EletricistasNaoEscaladosProps {
  filtros?: FiltrosRelatorioBase;
}

export default function EletricistasNaoEscalados({
  filtros,
}: EletricistasNaoEscaladosProps) {
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
  });

  const fetcher = useMemo(
    () => async () => {
      const { getEletricistasNaoEscalados } = await import(
        '@/lib/actions/relatorios/relatoriosBases'
      );
      const result = await getEletricistasNaoEscalados(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar eletricistas não escalados');
    },
    [filtros]
  );

  const { data: dadosRaw, loading, error, refetch } =
    useDataFetch<EletricistaNaoEscalado[]>(fetcher, [fetcher]);

  const dados: EletricistaNaoEscalado[] = dadosRaw ?? [];

  const handleExportarCsv = () => {
    if (dados.length === 0) {
      return;
    }

    const headers = [
      'Base',
      'Contrato',
      'Eletricista',
      'Matrícula',
      'Situação',
      'Motivo',
    ];

    const csvRows = [
      headers.join(';'),
      ...dados.map((item) => {
        const situacao =
          StatusEletricistaLabels[item.status] || item.status || '';
        return [
          item.baseNome,
          item.contratoNome,
          item.nome,
          item.matricula,
          situacao,
          item.statusMotivo || '',
        ].join(';');
      }),
    ];

    const csvContent = csvRows.join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    const dataAtual = new Date()
      .toISOString()
      .replace('T', '_')
      .replace(/[:]/g, '-')
      .slice(0, 16);
    const nomeArquivo = `eletricistas_nao_escalados_${dataAtual}.csv`;

    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = useMemo(
    () => [
      {
        title: 'Base',
        dataIndex: 'baseNome',
        key: 'baseNome',
        sorter: (a: EletricistaNaoEscalado, b: EletricistaNaoEscalado) =>
          a.baseNome.localeCompare(b.baseNome),
        width: 160,
      },
      {
        title: 'Contrato',
        dataIndex: 'contratoNome',
        key: 'contratoNome',
        sorter: (a: EletricistaNaoEscalado, b: EletricistaNaoEscalado) =>
          a.contratoNome.localeCompare(b.contratoNome),
        width: 160,
      },
      {
        title: 'Eletricista',
        dataIndex: 'nome',
        key: 'nome',
        sorter: (a: EletricistaNaoEscalado, b: EletricistaNaoEscalado) =>
          a.nome.localeCompare(b.nome),
        width: 200,
      },
      {
        title: 'Matrícula',
        dataIndex: 'matricula',
        key: 'matricula',
        width: 140,
      },
      {
        title: 'Situação',
        dataIndex: 'status',
        key: 'status',
        width: 180,
        render: (status: StatusEletricista) => (
          <Tag color={StatusEletricistaColors[status] || 'default'}>
            {StatusEletricistaLabels[status] || status}
          </Tag>
        ),
      },
      {
        title: 'Motivo',
        dataIndex: 'statusMotivo',
        key: 'statusMotivo',
        render: (value: string | null) => value || '-',
      },
    ],
    []
  );

  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card title="Eletricistas não escalados">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Eletricistas não escalados">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Eletricistas não escalados"
      extra={
        <Space size={8}>
          <Button onClick={handleExportarCsv} disabled={dados.length === 0}>
            Exportar CSV
          </Button>
          <Tag color={dados.length > 0 ? 'warning' : 'default'}>
            {dados.length}
          </Tag>
        </Space>
      }
    >
      <ErrorAlert error={error} onRetry={refetch} />
      {dados.length === 0 && !error ? (
        <Empty description="Nenhum eletricista sem escala" />
      ) : (
        <Table
          columns={columns}
          dataSource={dados}
          rowKey={(record) => `${record.eletricistaId}-${record.baseId}`}
          pagination={pagination}
          size="small"
          scroll={{ x: 1100 }}
        />
      )}
    </Card>
  );
}
