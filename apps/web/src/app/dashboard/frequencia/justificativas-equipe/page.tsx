'use client';

import { useState } from 'react';
import { Card, Table, Button, Space, Tag, DatePicker, Select, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { listJustificativasEquipe } from '@/lib/actions/justificativa-equipe/list';
import { aprovarJustificativaEquipe } from '@/lib/actions/justificativa-equipe/aprovar';
import { rejeitarJustificativaEquipe } from '@/lib/actions/justificativa-equipe/rejeitar';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Página de lista de justificativas de equipe pendentes para aprovar
 */
export default function JustificativasEquipePage() {
  const [filtros, setFiltros] = useState({
    status: 'pendente' as 'pendente' | 'aprovada' | 'rejeitada' | undefined,
    page: 1,
    pageSize: 20,
  });

  const [loading, setLoading] = useState(false);

  const { data, refetch } = useDataFetch(async () => {
    const result = await listJustificativasEquipe(filtros);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao carregar justificativas');
  }, [filtros]);

  const handleAprovar = async (id: number) => {
    setLoading(true);
    try {
      const result = await aprovarJustificativaEquipe({ id });
      if (result.success) {
        message.success('Justificativa aprovada com sucesso');
        refetch();
      } else {
        message.error(result.error || 'Erro ao aprovar justificativa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async (id: number) => {
    setLoading(true);
    try {
      const result = await rejeitarJustificativaEquipe({ id });
      if (result.success) {
        message.success('Justificativa rejeitada');
        refetch();
      } else {
        message.error(result.error || 'Erro ao rejeitar justificativa');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'dataReferencia',
      key: 'dataReferencia',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Equipe',
      dataIndex: ['equipe', 'nome'],
      key: 'equipe',
    },
    {
      title: 'Tipo',
      dataIndex: ['tipoJustificativa', 'nome'],
      key: 'tipo',
    },
    {
      title: 'Gera Falta',
      dataIndex: ['tipoJustificativa', 'geraFalta'],
      key: 'geraFalta',
      render: (geraFalta: boolean) => (
        <Tag color={geraFalta ? 'red' : 'green'}>
          {geraFalta ? 'Sim' : 'Não'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pendente: 'warning',
          aprovada: 'success',
          rejeitada: 'error',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => {
        if (record.status !== 'pendente') return null;
        return (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleAprovar(record.id)}
              loading={loading}
            >
              Aprovar
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleRejeitar(record.id)}
              loading={loading}
            >
              Rejeitar
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Card title="Justificativas de Equipe">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="Status"
            value={filtros.status}
            onChange={(value) => setFiltros({ ...filtros, status: value, page: 1 })}
            allowClear
          >
            <Select.Option value="pendente">Pendente</Select.Option>
            <Select.Option value="aprovada">Aprovada</Select.Option>
            <Select.Option value="rejeitada">Rejeitada</Select.Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.items || []}
          loading={!data}
          rowKey="id"
          pagination={{
            current: filtros.page,
            pageSize: filtros.pageSize,
            total: data?.total || 0,
            onChange: (page, pageSize) => setFiltros({ ...filtros, page, pageSize }),
          }}
        />
      </Space>
    </Card>
  );
}

