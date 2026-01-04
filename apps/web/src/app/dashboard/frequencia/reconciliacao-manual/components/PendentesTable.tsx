'use client';

import { Card, Table } from 'antd';
import dayjs from 'dayjs';

interface PendenteReconciliacao {
  equipeId: number;
  data: string;
  equipeNome?: string;
}

interface PendentesTableProps {
  pendentes: PendenteReconciliacao[];
}

/**
 * Componente de Tabela de Pendências de Reconciliação
 *
 * Exibe tabela com pendências encontradas para reconciliação
 */
export function PendentesTable({ pendentes }: PendentesTableProps) {
  if (pendentes.length === 0) {
    return null;
  }

  return (
    <Card size="small" title={`Pendências Encontradas (${pendentes.length})`}>
      <Table
        dataSource={pendentes}
        rowKey={(record) => `${record.equipeId}-${record.data}`}
        pagination={{ pageSize: 10 }}
        size="small"
        columns={[
          {
            title: 'Equipe',
            dataIndex: 'equipeNome',
            key: 'equipeNome',
          },
          {
            title: 'Equipe ID',
            dataIndex: 'equipeId',
            key: 'equipeId',
          },
          {
            title: 'Data',
            dataIndex: 'data',
            key: 'data',
            render: (data: string) => dayjs(data).format('DD/MM/YYYY'),
          },
        ]}
      />
    </Card>
  );
}

