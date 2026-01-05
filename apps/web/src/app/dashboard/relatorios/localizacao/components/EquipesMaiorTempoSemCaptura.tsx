'use client';

import { Table, Card, Empty, Spin, Tag, Typography } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import type { EquipeLocalizacaoStats } from '@/lib/actions/relatorios/relatoriosLocalizacao';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface EquipesMaiorTempoSemCapturaProps {
  filtros?: any;
}

export default function EquipesMaiorTempoSemCaptura({
  filtros,
}: EquipesMaiorTempoSemCapturaProps) {
  // Hook para paginação client-side
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
    showTotal: (total) => `Total de ${total} equipe${total !== 1 ? 's' : ''}`,
  });

  const { data: dados = [], loading, error, refetch } = useDataFetch<EquipeLocalizacaoStats[]>(
    async () => {
      const { getEquipesMaiorTempoSemCaptura } = await import(
        '@/lib/actions/relatorios/relatoriosLocalizacao'
      );
      const result = await getEquipesMaiorTempoSemCaptura(filtros);

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de equipes com maior tempo sem captura');
    },
    [filtros]
  );

  // Formatar tempo sem captura
  const formatarTempoSemCaptura = (minutos: number | null): string => {
    if (minutos === null) return 'N/A';
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}min`;
  };

  // Formatar data
  const formatarData = (data: Date | null): string => {
    if (!data) return 'N/A';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(data));
  };

  const columns: ColumnsType<EquipeLocalizacaoStats> = [
    {
      title: 'Equipe',
      dataIndex: 'equipeNome',
      key: 'equipeNome',
      sorter: (a, b) => a.equipeNome.localeCompare(b.equipeNome),
    },
    {
      title: 'Base',
      dataIndex: 'baseNome',
      key: 'baseNome',
      render: (text: string | null) => text || 'N/A',
      sorter: (a, b) => (a.baseNome || '').localeCompare(b.baseNome || ''),
    },
    {
      title: 'Contrato',
      dataIndex: 'contratoNome',
      key: 'contratoNome',
      sorter: (a, b) => a.contratoNome.localeCompare(b.contratoNome),
    },
    {
      title: 'Tipo de Equipe',
      dataIndex: 'tipoEquipeNome',
      key: 'tipoEquipeNome',
      sorter: (a, b) => a.tipoEquipeNome.localeCompare(b.tipoEquipeNome),
    },
    {
      title: 'Tempo Sem Captura',
      dataIndex: 'tempoSemCaptura',
      key: 'tempoSemCaptura',
      render: (value: number | null) => {
        if (value === null) {
          return (
            <Tag color="red">
              <Text strong>Sem localizações</Text>
            </Tag>
          );
        }
        const horas = Math.floor((value || 0) / 60);
        const dias = Math.floor(horas / 24);
        if (dias > 0) {
          return (
            <Tag color="red">
              <Text strong>{formatarTempoSemCaptura(value)}</Text>
            </Tag>
          );
        }
        if (horas > 0) {
          return (
            <Tag color="orange">
              <Text strong>{formatarTempoSemCaptura(value)}</Text>
            </Tag>
          );
        }
        return <Tag color="blue">{formatarTempoSemCaptura(value)}</Tag>;
      },
      sorter: (a, b) => {
        // Priorizar equipes sem localizações
        if (a.totalLocalizacoes === 0 && b.totalLocalizacoes > 0) return -1;
        if (a.totalLocalizacoes > 0 && b.totalLocalizacoes === 0) return 1;
        const tempoA = a.tempoSemCaptura || 0;
        const tempoB = b.tempoSemCaptura || 0;
        return tempoB - tempoA;
      },
      defaultSortOrder: 'descend',
    },
    {
      title: 'Última Captura',
      dataIndex: 'ultimaCaptura',
      key: 'ultimaCaptura',
      render: (value: Date | null) => {
        if (!value) {
          return (
            <Tag color="red">
              <Text strong>Nunca</Text>
            </Tag>
          );
        }
        return formatarData(value);
      },
      sorter: (a, b) => {
        if (!a.ultimaCaptura && !b.ultimaCaptura) return 0;
        if (!a.ultimaCaptura) return 1;
        if (!b.ultimaCaptura) return -1;
        return (
          new Date(a.ultimaCaptura).getTime() -
          new Date(b.ultimaCaptura).getTime()
        );
      },
    },
    {
      title: 'Total de Localizações',
      dataIndex: 'totalLocalizacoes',
      key: 'totalLocalizacoes',
      align: 'center',
      sorter: (a, b) => a.totalLocalizacoes - b.totalLocalizacoes,
      render: (value: number) => (
        <Tag color={value === 0 ? 'red' : value < 10 ? 'orange' : 'blue'}>
          {value}
        </Tag>
      ),
    },
    {
      title: 'Total de Turnos',
      dataIndex: 'totalTurnos',
      key: 'totalTurnos',
      align: 'center',
      sorter: (a, b) => a.totalTurnos - b.totalTurnos,
    },
  ];

  if (loading) {
    return (
      <Card title="Equipes com Maior Tempo Sem Captura de Localização">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!dados?.length && !error) {
    return (
      <Card title="Equipes com Maior Tempo Sem Captura de Localização">
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  return (
    <Card title="Equipes com Maior Tempo Sem Captura de Localização">
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de equipes com maior tempo sem captura" />
      {dados && dados.length > 0 && (
        <Table
          columns={columns}
          dataSource={dados}
          rowKey="equipeId"
          pagination={pagination}
          scroll={{ x: 'max-content' }}
        />
      )}
    </Card>
  );
}

