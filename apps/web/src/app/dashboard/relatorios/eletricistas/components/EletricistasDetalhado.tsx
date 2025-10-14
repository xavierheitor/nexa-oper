'use client';

import { Card, Empty, Spin, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';

interface EletricistaDetalhado {
  id: number;
  nome: string;
  matricula: string;
  cargo: string;
  estado: string;
  contrato: string;
  base: string;
  estatisticas: {
    diasTrabalho: number;
    diasFolga: number;
    diasFalta: number;
    totalDias: number;
  };
}

interface EletricistasDetalhadoProps {
  filtros?: any;
}

export default function EletricistasDetalhado({
  filtros,
}: EletricistasDetalhadoProps) {
  const [dados, setDados] = useState<EletricistaDetalhado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDados = async () => {
      setLoading(true);
      try {
        const { getEletricistasDetalhado } = await import(
          '@/lib/actions/relatorios/relatoriosEletricistas'
        );
        const result = await getEletricistasDetalhado(filtros);
        if (result.success && result.data) {
          setDados(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [filtros]);

  const columns = [
    {
      title: 'Matrícula',
      dataIndex: 'matricula',
      key: 'matricula',
      width: 100,
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a: EletricistaDetalhado, b: EletricistaDetalhado) =>
        a.nome.localeCompare(b.nome),
    },
    {
      title: 'Cargo',
      dataIndex: 'cargo',
      key: 'cargo',
      width: 150,
    },
    {
      title: 'Base',
      dataIndex: 'base',
      key: 'base',
      width: 150,
      render: (base: string) =>
        base === 'Sem Lotação' ? (
          <Tag color="red">{base}</Tag>
        ) : (
          <Tag color="blue">{base}</Tag>
        ),
    },
    {
      title: 'Trabalho',
      key: 'diasTrabalho',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: EletricistaDetalhado) => (
        <Tag color="green">{record.estatisticas.diasTrabalho}</Tag>
      ),
    },
    {
      title: 'Folga',
      key: 'diasFolga',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: EletricistaDetalhado) => (
        <Tag color="blue">{record.estatisticas.diasFolga}</Tag>
      ),
    },
    {
      title: 'Falta',
      key: 'diasFalta',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: EletricistaDetalhado) => (
        <Tag color="red">{record.estatisticas.diasFalta}</Tag>
      ),
    },
    {
      title: 'Total',
      key: 'totalDias',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: EletricistaDetalhado) =>
        record.estatisticas.totalDias,
    },
  ];

  if (loading) {
    return (
      <Card title="Eletricistas - Detalhado">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card title="Eletricistas - Detalhado">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  return (
    <Card title="Eletricistas - Detalhado" extra={`${dados.length} eletricista(s)`}>
      <Table
        columns={columns}
        dataSource={dados}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
        scroll={{ x: 1000 }}
      />
    </Card>
  );
}

