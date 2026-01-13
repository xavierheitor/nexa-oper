import React from 'react';
import { Card, Select, Space, Table, Tag } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { TurnoPrevisto } from '@/lib/types/turnoPrevisto';
import { formatTime } from '@/lib/utils/turnoPrevistoHelpers';

interface TurnosPrevistosTableProps {
  turnosPrevistosFiltrados: TurnoPrevisto[];
  pagination: TablePaginationConfig | false | undefined;
  filtroBase: string | undefined;
  setFiltroBase: (value: string | undefined) => void;
  filtroTipoEquipe: string | undefined;
  setFiltroTipoEquipe: (value: string | undefined) => void;
  basesData: Array<{ id: number; nome: string }> | undefined;
  tiposEquipeData: Array<{ id: number; nome: string }> | undefined;
  filtroStatus: string | undefined;
  setFiltroStatus: (value: string | undefined) => void;
  filtroHorario: string | undefined;
  setFiltroHorario: (value: string | undefined) => void;
}

export const TurnosPrevistosTable: React.FC<TurnosPrevistosTableProps> = ({
  turnosPrevistosFiltrados,
  pagination,
  filtroBase,
  setFiltroBase,
  filtroTipoEquipe,
  setFiltroTipoEquipe,
  basesData,
  tiposEquipeData,
  filtroStatus,
  setFiltroStatus,
  filtroHorario,
  setFiltroHorario,
}) => {
  return (
    <Card
      title='Detalhamento de Turnos Previstos'
      style={{ marginBottom: 24 }}
      extra={
        <Space>
          <Select
            placeholder='Filtrar por Base'
            allowClear
            style={{ width: 200 }}
            value={filtroBase}
            onChange={value => setFiltroBase(value || undefined)}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={basesData?.map(base => ({
              label: base.nome,
              value: base.nome,
            }))}
          />
          <Select
            placeholder='Filtrar por Tipo de Equipe'
            allowClear
            style={{ width: 200 }}
            value={filtroTipoEquipe}
            onChange={value => setFiltroTipoEquipe(value || undefined)}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '')
                .toString()
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            options={tiposEquipeData?.map(tipo => ({
              label: tipo.nome,
              value: tipo.nome,
            }))}
          />
          <Select
            placeholder='Filtrar por Status'
            allowClear
            style={{ width: 200 }}
            value={filtroStatus}
            onChange={value => setFiltroStatus(value || undefined)}
            options={[
              { label: 'Aderente', value: 'ADERENTE' },
              { label: 'Não Aderente', value: 'NAO_ADERENTE' },
              { label: 'Não Aberto', value: 'NAO_ABERTO' },
              { label: 'Turno Extra', value: 'TURNO_EXTRA' },
            ]}
          />
          <Select
            placeholder='Filtrar por Horário'
            allowClear
            style={{ width: 180 }}
            value={filtroHorario}
            onChange={value => setFiltroHorario(value || undefined)}
            options={[
              { label: 'Com Horário', value: 'COM_HORARIO' },
              { label: 'Sem Horário', value: 'SEM_HORARIO' },
            ]}
          />
        </Space>
      }
    >
      <Table
        dataSource={turnosPrevistosFiltrados}
        rowKey={record =>
          `${record.equipeId}-${record.status}-${record.turnoId || 'no-turno'}`
        }
        pagination={pagination}
        columns={[
          {
            title: 'Base',
            key: 'base',
            width: 150,
            render: (_: unknown, record: TurnoPrevisto) =>
              record.baseNome || '-',
          },
          {
            title: 'Equipe',
            dataIndex: 'equipeNome',
            key: 'equipeNome',
          },
          {
            title: 'Tipo',
            dataIndex: 'tipoEquipeNome',
            key: 'tipoEquipeNome',
          },
          {
            title: 'Horário Previsto',
            dataIndex: 'horarioPrevisto',
            key: 'horarioPrevisto',
            render: (horario: string | null) =>
              horario ? formatTime(horario) : 'Sem Horário',
          },
          {
            title: 'Eletricistas',
            key: 'eletricistas',
            render: (_: unknown, record: TurnoPrevisto) => {
              // Se for turno extra, não precisa colorir
              if (record.status === 'TURNO_EXTRA') {
                return (
                  <Space direction='vertical' size={0}>
                    {record.eletricistas.map(el => (
                      <span key={el.id}>
                        {el.nome} ({el.matricula})
                      </span>
                    ))}
                  </Space>
                );
              }

              // Para turnos previstos, verificar quais abriram
              // Se status é NAO_ABERTO, nenhum abriu
              // Se status é ADERENTE ou NAO_ADERENTE, verificar quais abriram
              const eletricistasQueAbriramIds = new Set(
                record.status === 'NAO_ABERTO'
                  ? []
                  : record.eletricistasQueAbriram?.map(e => e.id) || []
              );

              return (
                <Space direction='vertical' size={0}>
                  {record.eletricistas.map(el => {
                    const abriu = eletricistasQueAbriramIds.has(el.id);
                    const style: React.CSSProperties = {
                      backgroundColor: abriu ? '#f6ffed' : '#fff1f0',
                      color: abriu ? '#52c41a' : '#ff4d4f',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block',
                    };
                    return (
                      <span key={el.id} style={style}>
                        {el.nome} ({el.matricula})
                      </span>
                    );
                  })}
                </Space>
              );
            },
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (
              status: TurnoPrevisto['status'],
              record: TurnoPrevisto
            ) => {
              let color: string;
              let text: string;
              switch (status) {
                case 'ADERENTE':
                  color = 'success';
                  text = 'Aderente';
                  break;
                case 'NAO_ADERENTE':
                  color = 'warning';
                  text = record.diferencaMinutos
                    ? `Não Aderente (+${Math.round(record.diferencaMinutos)}min)`
                    : 'Não Aderente';
                  break;
                case 'NAO_ABERTO':
                  color = 'error';
                  text = 'Não Aberto';
                  break;
                case 'TURNO_EXTRA':
                  color = 'processing';
                  text = 'Turno Extra';
                  break;
                default:
                  color = 'default';
                  text = status;
              }
              return <Tag color={color}>{text}</Tag>;
            },
          },
          {
            title: 'Horário Abertura',
            key: 'dataAbertura',
            render: (_: unknown, record: TurnoPrevisto) => {
              if (!record.dataAbertura) return '-';
              const data = new Date(record.dataAbertura);
              return data.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              });
            },
          },
        ]}
      />
    </Card>
  );
};
