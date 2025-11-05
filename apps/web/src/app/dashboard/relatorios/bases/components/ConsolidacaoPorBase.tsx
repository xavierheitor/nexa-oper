'use client';

import { Card, Empty, Spin, Table, Tag } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface DadosBase {
  id: number;
  nome: string;
  contrato: string;
  veiculos: number;
  eletricistas: {
    total: number;
    escalados: number;
    naoEscalados: number;
  };
  equipes: {
    total: number;
    escaladas: number;
    inativas: number;
  };
}

interface ConsolidacaoPorBaseProps {
  filtros?: any;
}

export default function ConsolidacaoPorBase({ filtros }: ConsolidacaoPorBaseProps) {
  const { data: dados = [], loading } = useDataFetch<DadosBase[]>(
    async () => {
      const { getConsolidacaoPorBase } = await import(
        '@/lib/actions/relatorios/relatoriosBases'
      );
      const result = await getConsolidacaoPorBase(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de consolidação por base');
    },
    [filtros]
  );

  const columns = [
    {
      title: 'Base',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a: DadosBase, b: DadosBase) => a.nome.localeCompare(b.nome),
      width: 200,
    },
    {
      title: 'Contrato',
      dataIndex: 'contrato',
      key: 'contrato',
      width: 150,
    },
    {
      title: 'Veículos',
      dataIndex: 'veiculos',
      key: 'veiculos',
      align: 'center' as const,
      width: 100,
      sorter: (a: DadosBase, b: DadosBase) => a.veiculos - b.veiculos,
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Eletricistas Total',
      key: 'eletricistasTotal',
      align: 'center' as const,
      width: 140,
      sorter: (a: DadosBase, b: DadosBase) => a.eletricistas.total - b.eletricistas.total,
      render: (_: any, record: DadosBase) => (
        <Tag color="green">{record.eletricistas.total}</Tag>
      ),
    },
    {
      title: 'Eletricistas Escalados',
      key: 'eletricistasEscalados',
      align: 'center' as const,
      width: 170,
      sorter: (a: DadosBase, b: DadosBase) =>
        a.eletricistas.escalados - b.eletricistas.escalados,
      render: (_: any, record: DadosBase) => (
        <Tag color="success">{record.eletricistas.escalados}</Tag>
      ),
    },
    {
      title: 'Eletricistas Não Escalados',
      key: 'eletricistasNaoEscalados',
      align: 'center' as const,
      width: 200,
      sorter: (a: DadosBase, b: DadosBase) =>
        a.eletricistas.naoEscalados - b.eletricistas.naoEscalados,
      render: (_: any, record: DadosBase) => (
        <Tag color={record.eletricistas.naoEscalados > 0 ? 'warning' : 'default'}>
          {record.eletricistas.naoEscalados}
        </Tag>
      ),
    },
    {
      title: 'Equipes Total',
      key: 'equipesTotal',
      align: 'center' as const,
      width: 120,
      sorter: (a: DadosBase, b: DadosBase) => a.equipes.total - b.equipes.total,
      render: (_: any, record: DadosBase) => (
        <Tag color="purple">{record.equipes.total}</Tag>
      ),
    },
    {
      title: 'Equipes Escaladas',
      key: 'equipesEscaladas',
      align: 'center' as const,
      width: 150,
      sorter: (a: DadosBase, b: DadosBase) =>
        a.equipes.escaladas - b.equipes.escaladas,
      render: (_: any, record: DadosBase) => (
        <Tag color="success">{record.equipes.escaladas}</Tag>
      ),
    },
    {
      title: 'Equipes Inativas',
      key: 'equipesInativas',
      align: 'center' as const,
      width: 130,
      sorter: (a: DadosBase, b: DadosBase) =>
        a.equipes.inativas - b.equipes.inativas,
      render: (_: any, record: DadosBase) => (
        <Tag color={record.equipes.inativas > 0 ? 'warning' : 'default'}>
          {record.equipes.inativas}
        </Tag>
      ),
    },
  ];

  if (loading) {
    return (
      <Card title="Consolidação por Base">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Consolidação por Base">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  // Calcular totais
  const totais = dados.reduce(
    (acc, base) => ({
      veiculos: acc.veiculos + base.veiculos,
      eletricistasTotal: acc.eletricistasTotal + base.eletricistas.total,
      eletricistasEscalados: acc.eletricistasEscalados + base.eletricistas.escalados,
      eletricistasNaoEscalados: acc.eletricistasNaoEscalados + base.eletricistas.naoEscalados,
      equipesTotal: acc.equipesTotal + base.equipes.total,
      equipesEscaladas: acc.equipesEscaladas + base.equipes.escaladas,
      equipesInativas: acc.equipesInativas + base.equipes.inativas,
    }),
    {
      veiculos: 0,
      eletricistasTotal: 0,
      eletricistasEscalados: 0,
      eletricistasNaoEscalados: 0,
      equipesTotal: 0,
      equipesEscaladas: 0,
      equipesInativas: 0,
    }
  );

  return (
    <Card
      title="Consolidação por Base"
      extra={
        <div style={{ fontSize: '12px' }}>
          <Tag color="blue">{totais.veiculos} veículos</Tag>
          <Tag color="green">{totais.eletricistasTotal} eletricistas</Tag>
          <Tag color="warning">{totais.eletricistasNaoEscalados} não escalados</Tag>
          <Tag color="purple">{totais.equipesTotal} equipes</Tag>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={dados}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 1500 }}
      />
    </Card>
  );
}

