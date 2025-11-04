'use client';

import { Table, Tag, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DetalhamentoDia } from '@/lib/schemas/turnoRealizadoSchema';
import StatusTag from './StatusTag';
import TipoHoraExtraTag from './TipoHoraExtraTag';
import dayjs from 'dayjs';

interface HistoricoTableProps {
  dados: DetalhamentoDia[];
  loading?: boolean;
  onVerDetalhes?: (dia: DetalhamentoDia) => void;
}

/**
 * Tabela de histórico detalhado por dia
 */
export default function HistoricoTable({
  dados,
  loading = false,
  onVerDetalhes,
}: HistoricoTableProps) {
  const columns: ColumnsType<DetalhamentoDia> = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (date: Date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => a.data.getTime() - b.data.getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => {
        const tipoLabels: Record<string, string> = {
          trabalho: 'Trabalho',
          falta: 'Falta',
          hora_extra: 'Hora Extra',
          folga: 'Folga',
        };
        return <Tag>{tipoLabels[tipo] || tipo}</Tag>;
      },
      filters: [
        { text: 'Trabalho', value: 'trabalho' },
        { text: 'Falta', value: 'falta' },
        { text: 'Hora Extra', value: 'hora_extra' },
        { text: 'Folga', value: 'folga' },
      ],
      onFilter: (value, record) => record.tipo === value,
    },
    {
      title: 'Horas Previstas',
      dataIndex: 'horasPrevistas',
      key: 'horasPrevistas',
      render: (horas: number) => (horas > 0 ? `${horas.toFixed(1)}h` : '-'),
      align: 'right',
    },
    {
      title: 'Horas Realizadas',
      dataIndex: 'horasRealizadas',
      key: 'horasRealizadas',
      render: (horas: number) => (horas > 0 ? `${horas.toFixed(1)}h` : '-'),
      align: 'right',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: DetalhamentoDia) => {
        if (record.tipo === 'falta') {
          return <StatusTag status={status} tipo="falta" />;
        }
        if (record.tipo === 'hora_extra') {
          return <StatusTag status={status} tipo="horaExtra" />;
        }
        return <StatusTag status={status} tipo="geral" />;
      },
    },
    {
      title: 'Tipo Hora Extra',
      dataIndex: 'tipoHoraExtra',
      key: 'tipoHoraExtra',
      render: (tipo: string | undefined) =>
        tipo ? <TipoHoraExtraTag tipo={tipo} /> : null,
    },
  ];

  return (
    <Table<DetalhamentoDia>
      columns={columns}
      dataSource={dados.map((d, idx) => ({ ...d, key: idx }))}
      loading={loading}
      pagination={false}
      size="small"
    />
  );
}

