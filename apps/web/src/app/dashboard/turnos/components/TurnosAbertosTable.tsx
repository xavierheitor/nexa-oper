import React from 'react';
import { Table, Space, Tooltip, Button, Tag, Empty } from 'antd';
import {
  AppstoreOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { TurnoData } from '@/lib/types/turno-frontend';
import type { TablePaginationConfig } from 'antd/es/table';

interface TurnosAbertosTableProps {
  turnosFiltrados: TurnoData[];
  pagination: TablePaginationConfig | false | undefined;
  handleViewChecklists: (turno: TurnoData) => void;
  handleViewAtividades: (turno: TurnoData) => void;
  handleViewLocation: (turno: TurnoData) => void;
  handleFecharTurno: (turno: TurnoData) => void;
}

export const TurnosAbertosTable: React.FC<TurnosAbertosTableProps> = ({
  turnosFiltrados,
  pagination,
  handleViewChecklists,
  handleViewAtividades,
  handleViewLocation,
  handleFecharTurno,
}) => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Veículo',
      key: 'veiculo',
      render: (_: unknown, record: TurnoData) => (
        <Space direction='vertical' size={0}>
          <span>
            <strong>{record.veiculoPlaca}</strong>
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.veiculoModelo}
          </span>
        </Space>
      ),
    },
    {
      title: 'Equipe',
      dataIndex: 'equipeNome',
      key: 'equipe',
    },
    {
      title: 'Tipo de Equipe',
      dataIndex: 'tipoEquipeNome',
      key: 'tipoEquipe',
    },
    {
      title: 'Base',
      dataIndex: 'baseNome',
      key: 'base',
    },
    {
      title: 'Eletricistas',
      key: 'eletricistas',
      render: (_: unknown, record: TurnoData) => (
        <Space direction='vertical' size={0}>
          {record.eletricistas?.map(elet => (
            <Tooltip
              key={elet.id}
              title={`Matrícula: ${elet.matricula}${elet.motorista ? ' - Motorista' : ''}`}
            >
              <Space size={4} style={{ cursor: 'help' }}>
                {elet.motorista && <CarOutlined style={{ color: '#1890ff' }} />}
                <span>{elet.nome}</span>
              </Space>
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: 'Data/Hora Início',
      key: 'dataInicio',
      render: (_: unknown, record: TurnoData) => {
        const data = new Date(record.dataInicio);
        return (
          <span>
            {data.toLocaleDateString('pt-BR')}{' '}
            {data.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      title: 'KM Inicial',
      key: 'kmInicio',
      width: 120,
      align: 'right' as const,
      render: (_: unknown, record: TurnoData) => (
        <span>{record.kmInicio?.toLocaleString('pt-BR') || '-'}</span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: TurnoData) => {
        const status = record.dataFim ? 'FECHADO' : 'ABERTO';
        return (
          <Tag color={status === 'ABERTO' ? 'green' : 'default'}>{status}</Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 280,
      render: (_: unknown, record: TurnoData) => (
        <Space>
          <Tooltip title='Ver Checklists'>
            <Button
              type='primary'
              size='small'
              icon={<CheckOutlined />}
              onClick={() => handleViewChecklists(record)}
            />
          </Tooltip>
          <Tooltip title='Ver Atividades do Turno'>
            <Button
              type='default'
              size='small'
              icon={<AppstoreOutlined />}
              onClick={() => handleViewAtividades(record)}
            />
          </Tooltip>
          <Tooltip title='Ver Histórico de Localização'>
            <Button
              type='default'
              size='small'
              icon={<EnvironmentOutlined />}
              onClick={() => handleViewLocation(record)}
            />
          </Tooltip>
          {!record.dataFim && (
            <Tooltip title='Fechar Turno'>
              <Button
                type='default'
                danger
                size='small'
                icon={<CloseOutlined />}
                onClick={() => handleFecharTurno(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={turnosFiltrados}
      rowKey='id'
      pagination={pagination}
      locale={{
        emptyText: (
          <Empty description='Nenhum turno encontrado com os filtros aplicados' />
        ),
      }}
    />
  );
};
