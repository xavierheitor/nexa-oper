'use client';

import { Card, Table, Button, Space, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listTiposJustificativa } from '@/lib/actions/tipo-justificativa/list';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

/**
 * Página CRUD de tipos de justificativa
 */
export default function TipoJustificativaPage() {
  const { data } = useDataFetch(async () => {
    const result = await listTiposJustificativa({ page: 1, pageSize: 100 });
    if (result.success) {
      return result.data;
    }
    return { data: [], total: 0 };
  }, []);

  const columns = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
    },
    {
      title: 'Descrição',
      dataIndex: 'descricao',
      key: 'descricao',
    },
    {
      title: 'Gera Falta',
      dataIndex: 'geraFalta',
      key: 'geraFalta',
      render: (geraFalta: boolean) => (
        <Tag color={geraFalta ? 'red' : 'green'}>
          {geraFalta ? 'Sim' : 'Não'}
        </Tag>
      ),
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      key: 'ativo',
      render: (ativo: boolean) => (
        <Tag color={ativo ? 'success' : 'default'}>
          {ativo ? 'Ativo' : 'Inativo'}
        </Tag>
      ),
    },
  ];

  return (
    <Card
      title="Tipos de Justificativa"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          Novo Tipo
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data?.data || []}
        loading={!data}
        rowKey="id"
        pagination={false}
      />
    </Card>
  );
}

