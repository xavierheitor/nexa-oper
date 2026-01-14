import { Card, Space, Select, Table } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table';
import type { TurnoPrevisto } from '@/lib/types/turnoPrevisto';
import { formatTime } from '@/lib/utils/turnoPrevistoHelpers';

interface TurnoNaoAbertoTableProps {
  title: string | React.ReactNode;
  dataSource: TurnoPrevisto[];
  loading?: boolean;
  pagination: TablePaginationConfig | false | undefined;
  filtroBase?: string;
  setFiltroBase?: (value: string | undefined) => void;
  filtroTipoEquipe?: string;
  setFiltroTipoEquipe?: (value: string | undefined) => void;
  basesData?: Array<{ id: number; nome: string }>;
  tiposEquipeData?: Array<{ id: number; nome: string }>;
  extraTag?: React.ReactNode;
  showFilters?: boolean;
}

export const TurnosNaoAbertosTable: React.FC<TurnoNaoAbertoTableProps> = ({
  title,
  dataSource,
  pagination,
  filtroBase,
  setFiltroBase,
  filtroTipoEquipe,
  setFiltroTipoEquipe,
  basesData,
  tiposEquipeData,
  extraTag,
  showFilters = false,
}) => {
  return (
    <Card
      title={title}
      style={{
        marginBottom: showFilters ? 32 : 24,
        marginTop: showFilters ? 24 : 0,
      }}
      extra={
        <Space>
          {showFilters && (
            <>
              <Select
                placeholder='Filtrar por Base'
                allowClear
                style={{ width: 200 }}
                value={filtroBase}
                onChange={value => setFiltroBase?.(value || undefined)}
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
                onChange={value => setFiltroTipoEquipe?.(value || undefined)}
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
            </>
          )}
          {extraTag}
        </Space>
      }
    >
      <Table
        dataSource={dataSource}
        rowKey={record =>
          `${record.equipeId}-${record.status}-${record.horarioPrevisto || 'no-time'}`
        }
        pagination={pagination}
        size='small'
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
            width: 200,
            fixed: 'left',
          },
          {
            title: 'Tipo de Equipe',
            dataIndex: 'tipoEquipeNome',
            key: 'tipoEquipeNome',
            width: 150,
          },
          {
            title: 'Horário Previsto',
            dataIndex: 'horarioPrevisto',
            key: 'horarioPrevisto',
            width: 140,
            render: (horario: string | null) =>
              horario ? formatTime(horario) : 'Sem Horário',
          },
          {
            title: 'Eletricistas',
            key: 'eletricistas',
            render: (_: unknown, record: TurnoPrevisto) => (
              <Space direction='vertical' size={0}>
                {record.eletricistas.map(el => (
                  <span key={el.id}>
                    {el.nome} ({el.matricula})
                  </span>
                ))}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
};
