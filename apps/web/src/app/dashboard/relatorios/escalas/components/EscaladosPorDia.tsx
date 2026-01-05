'use client';

import { useState } from 'react';
import { Card, Empty, Spin, Tag, Typography, Space, Divider, Table, DatePicker } from 'antd';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import { UserOutlined, TeamOutlined, CalendarOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface EletricistaFolga {
  id: number;
  nome: string;
  matricula: string | null;
}

interface EletricistaEscalado {
  id: number;
  nome: string;
  matricula: string | null;
  equipeId: number;
  equipeNome: string;
  contratoNome: string;
  baseId?: number;
  baseNome?: string;
}

interface DadosEscaladosPorDia {
  emFolga: EletricistaFolga[];
  escalados: EletricistaEscalado[];
}

interface EscaladosPorDiaProps {
  filtros?: {
    baseId?: number;
    contratoId?: number;
  };
}

export default function EscaladosPorDia({ filtros }: EscaladosPorDiaProps) {
  const [dataSelecionada, setDataSelecionada] = useState<string | undefined>(undefined);

  const handleDiaChange = (date: any) => {
    if (date) {
      setDataSelecionada(date.startOf('day').toISOString());
    } else {
      setDataSelecionada(undefined);
    }
  };

  const { data, loading, error, refetch } = useDataFetch<DadosEscaladosPorDia | null>(
    async () => {
      // Só busca se tiver data selecionada
      if (!dataSelecionada) {
        return null;
      }

      const { getEscaladosPorDia } = await import(
        '@/lib/actions/relatorios/relatoriosEscalas'
      );
      const result = await getEscaladosPorDia({
        data: dataSelecionada,
        baseId: filtros?.baseId,
        contratoId: filtros?.contratoId,
      });

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar dados de escalados por dia');
    },
    [dataSelecionada, filtros?.baseId, filtros?.contratoId]
  );

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Escalados e Folgas por Dia</span>
          </Space>
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  // Formatar data para exibição
  const dataFormatada = dataSelecionada
    ? new Date(dataSelecionada).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        weekday: 'long',
      })
    : '';

  if (!dataSelecionada) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Escalados e Folgas por Dia</span>
          </Space>
        }
        extra={
          <DatePicker
            value={null}
            onChange={handleDiaChange}
            format='DD/MM/YYYY'
            placeholder='Selecionar dia específico'
            style={{ width: 200 }}
            allowClear
          />
        }
      >
        <Empty
          description="Selecione uma data para visualizar os escalados e folgas"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Escalados e Folgas por Dia</span>
          </Space>
        }
        extra={
          <DatePicker
            value={dataSelecionada ? dayjs(dataSelecionada) : null}
            onChange={handleDiaChange}
            format='DD/MM/YYYY'
            placeholder='Selecionar dia específico'
            style={{ width: 200 }}
            allowClear
          />
        }
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>Escalados e Folgas por Dia</span>
          </Space>
        }
        extra={
          <DatePicker
            value={dataSelecionada ? dayjs(dataSelecionada) : null}
            onChange={handleDiaChange}
            format='DD/MM/YYYY'
            placeholder='Selecionar dia específico'
            style={{ width: 200 }}
            allowClear
          />
        }
      >
        <Empty description="Nenhum dado disponível" />
      </Card>
    );
  }

  const { emFolga, escalados } = data;

  return (
    <Card
      title={
        <Space>
          <CalendarOutlined />
          <span>Escalados e Folgas por Dia</span>
        </Space>
      }
      extra={
        <Space>
          <DatePicker
            value={dataSelecionada ? dayjs(dataSelecionada) : null}
            onChange={handleDiaChange}
            format='DD/MM/YYYY'
            placeholder='Selecionar dia específico'
            style={{ width: 200 }}
            allowClear
          />
        </Space>
      }
    >
      <ErrorAlert error={error} onRetry={refetch} message="Erro ao carregar dados de escalados por dia" />
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: '16px' }}>
          Data: {dataFormatada}
        </Text>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Seção de Escalados */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            Escalados para Trabalhar ({escalados.length})
          </Title>
          {escalados.length === 0 ? (
            <Empty
              description="Nenhum eletricista escalado neste dia"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <Table
              dataSource={escalados}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Eletricista',
                  key: 'nome',
                  render: (_, record) => (
                    <Space>
                      <UserOutlined />
                      <Text strong>{record.nome}</Text>
                      {record.matricula && (
                        <Text type="secondary">({record.matricula})</Text>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Equipe',
                  key: 'equipe',
                  render: (_, record) => (
                    <Tag color="green" icon={<TeamOutlined />}>
                      {record.equipeNome}
                    </Tag>
                  ),
                },
                {
                  title: 'Base',
                  key: 'base',
                  render: (_, record) =>
                    record.baseNome ? (
                      <Tag color="blue" icon={<HomeOutlined />}>
                        {record.baseNome}
                      </Tag>
                    ) : (
                      <Text type="secondary">-</Text>
                    ),
                },
                {
                  title: 'Contrato',
                  key: 'contrato',
                  render: (_, record) => (
                    <Tag color="purple" icon={<FileTextOutlined />}>
                      {record.contratoNome}
                    </Tag>
                  ),
                },
              ]}
            />
          )}
        </div>

        <Divider />

        {/* Seção de Folgas */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            Em Folga ({emFolga.length})
          </Title>
          {emFolga.length === 0 ? (
            <Empty
              description="Nenhum eletricista em folga neste dia"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ padding: '20px 0' }}
            />
          ) : (
            <Table
              dataSource={emFolga}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Eletricista',
                  key: 'nome',
                  render: (_, record) => (
                    <Space>
                      <UserOutlined />
                      <Text>{record.nome}</Text>
                      {record.matricula && (
                        <Text type="secondary">({record.matricula})</Text>
                      )}
                    </Space>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: () => <Tag color="blue">Folga</Tag>,
                },
              ]}
            />
          )}
        </div>
      </Space>
    </Card>
  );
}

