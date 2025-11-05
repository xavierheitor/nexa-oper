'use client';

import { Card, Empty, Spin, Table, Tag } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

interface EquipeSemHorario {
  id: number;
  nome: string;
  tipoEquipe: string;
  contrato: string;
  base: string;
}

interface EquipesSemHorarioProps {
  filtros?: any;
}

export default function EquipesSemHorario({ filtros }: EquipesSemHorarioProps) {
  const { data: dados = [], loading } = useDataFetch<EquipeSemHorario[]>(
    async () => {
      const { getEquipesSemHorario } = await import(
        '@/lib/actions/relatorios/relatoriosEquipes'
      );
      const result = await getEquipesSemHorario(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de equipes sem horário');
    },
    [filtros]
  );

  const columns = [
    {
      title: 'Equipe',
      dataIndex: 'nome',
      key: 'nome',
      sorter: (a: EquipeSemHorario, b: EquipeSemHorario) =>
        a.nome.localeCompare(b.nome),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoEquipe',
      key: 'tipoEquipe',
    },
    {
      title: 'Base',
      dataIndex: 'base',
      key: 'base',
      render: (base: string) =>
        base === 'Sem Lotação' ? (
          <Tag color="red">{base}</Tag>
        ) : (
          <Tag color="blue">{base}</Tag>
        ),
    },
    {
      title: 'Contrato',
      dataIndex: 'contrato',
      key: 'contrato',
    },
  ];

  if (loading) {
    return (
      <Card
        title="Equipes sem Horário Definido"
        extra={<Tag color="warning">Pendente</Tag>}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (dados.length === 0) {
    return (
      <Card
        title="Equipes sem Horário Definido"
        extra={<Tag color="success">0 pendências</Tag>}
      >
        <Empty description="Todas as equipes têm horário definido" />
      </Card>
    );
  }

  return (
    <Card
      title="Equipes sem Horário Definido"
      extra={<Tag color="warning">{dados.length} equipe(s)</Tag>}
    >
      <Table
        columns={columns}
        dataSource={dados}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size="small"
      />
    </Card>
  );
}

