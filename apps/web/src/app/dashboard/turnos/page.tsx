'use client';

/**
 * Página de Turnos
 *
 * Dashboard com informações sobre turnos abertos, incluindo:
 * - Total de turnos abertos
 * - Turnos abertos por base
 * - Tabela com detalhes dos turnos abertos
 */

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { useEntityData } from '@/lib/hooks/useEntityData';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';

const { Title } = Typography;

interface DadosGraficoTipoEquipe {
  tipo: string;
  quantidade: number;
}

interface DadosGraficoHora {
  hora: string;
  tipo: string;
  quantidade: number;
}

interface DadosGraficoBase {
  base: string;
  quantidade: number;
}

/**
 * Interface para dados do turno
 */
interface TurnoData {
  id: number;
  dataSolicitacao: string;
  dataInicio: string;
  dataFim?: string;
  veiculoId: number;
  veiculoPlaca: string;
  veiculoModelo: string;
  equipeId: number;
  equipeNome: string;
  tipoEquipeNome: string;
  baseNome: string;
  dispositivo: string;
  kmInicio: number;
  kmFim?: number;
  status: string;
  eletricistas: Array<{
    id: number;
    nome: string;
    matricula: string;
  }>;
}

export default function TurnosPage() {
  const [turnosAbertos, setTurnosAbertos] = useState<TurnoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrafico, setLoadingGrafico] = useState(true);
  const [loadingGraficoHora, setLoadingGraficoHora] = useState(true);
  const [loadingGraficoBase, setLoadingGraficoBase] = useState(true);
  const [dadosGrafico, setDadosGrafico] = useState<DadosGraficoTipoEquipe[]>([]);
  const [dadosGraficoHora, setDadosGraficoHora] = useState<DadosGraficoHora[]>([]);
  const [dadosGraficoBase, setDadosGraficoBase] = useState<DadosGraficoBase[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalDiarios: 0,
    porBase: {} as Record<string, number>,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar turnos abertos
        const resultAbertos = await listTurnos({
          page: 1,
          pageSize: 1000,
          status: 'ABERTO',
        });

        // Buscar todos os turnos do dia (que começaram hoje entre 00:00:00 e 23:59:59)
        const hoje = new Date();
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
        const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

        const resultTodos = await listTurnos({
          page: 1,
          pageSize: 1000,
          dataInicio: inicioHoje,
          dataFim: fimHoje,
        });

        if (resultAbertos.success && resultAbertos.data) {
          const turnos = resultAbertos.data.data || [];
          setTurnosAbertos(turnos);

          // Calcular estatísticas
          const porBase: Record<string, number> = {};
          turnos.forEach((turno: any) => {
            const base = turno.equipeNome?.split('-')[0] || 'Não identificada';
            porBase[base] = (porBase[base] || 0) + 1;
          });

          const totalDiarios = resultTodos.success && resultTodos.data ? (resultTodos.data.data?.length || 0) : 0;

          setStats({
            total: turnos.length,
            totalDiarios,
            porBase,
          });
        } else if (resultAbertos.redirectToLogin) {
          window.location.href = '/login';
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar turnos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Buscar dados do gráfico
    const fetchGrafico = async () => {
      setLoadingGrafico(true);
      try {
        const result = await getStatsByTipoEquipe();
        if (result.success && result.data) {
          setDadosGrafico(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error);
      } finally {
        setLoadingGrafico(false);
      }
    };

    fetchGrafico();

    // Buscar dados do gráfico por hora e tipo
    const fetchGraficoHora = async () => {
      setLoadingGraficoHora(true);
      try {
        const result = await getStatsByHoraETipoEquipe();
        if (result.success && result.data) {
          setDadosGraficoHora(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico por hora:', error);
      } finally {
        setLoadingGraficoHora(false);
      }
    };

    fetchGraficoHora();

    // Buscar dados do gráfico por base
    const fetchGraficoBase = async () => {
      setLoadingGraficoBase(true);
      try {
        const result = await getStatsByBase();
        if (result.success && result.data) {
          setDadosGraficoBase(result.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico por base:', error);
      } finally {
        setLoadingGraficoBase(false);
      }
    };

    fetchGraficoBase();
  }, []);

  const columns: ColumnsType<TurnoData> = [
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
        <Space direction="vertical" size={0}>
          <span><strong>{record.veiculoPlaca}</strong></span>
          <span style={{ fontSize: '12px', color: '#666' }}>{record.veiculoModelo}</span>
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
        <Space direction="vertical" size={0}>
          {record.eletricistas?.map((elet) => (
            <span key={elet.id}>{elet.nome}</span>
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
            {data.toLocaleDateString('pt-BR')} {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: TurnoData) => {
        const status = record.dataFim ? 'FECHADO' : 'ABERTO';
        return (
          <Tag color={status === 'ABERTO' ? 'green' : 'default'}>
            {status}
          </Tag>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Turnos Abertos</Title>

      {/* Estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Turnos Abertos no momento"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Aberturas totais do dia"
              value={stats.totalDiarios}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={7}>
          <Card title="Turnos por Tipo de Equipe">
            {loadingGrafico ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : dadosGrafico.length === 0 ? (
              <Empty description="Nenhum dado disponível" />
            ) : (
              <Column
                data={dadosGrafico}
                xField="tipo"
                yField="quantidade"
                height={300}
                columnWidthRatio={0.1}
                label={{
                  text: 'quantidade',
                  position: 'top',
                  style: {
                    fill: '#000',
                    fontWeight: 'bold',
                  },
                }}
                style={{
                  fill: '#1890ff',
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                }}
                    yAxis={{
                      tickCount: 5,
                      label: {
                        formatter: (text: string) => {
                          const num = parseFloat(text);
                          return Number.isInteger(num) ? num.toString() : '';
                        },
                      },
                    }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={17}>
          <Card title="Turnos Diários por Hora">
            {loadingGraficoHora ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : dadosGraficoHora.length === 0 ? (
              <Empty description="Nenhum dado disponível" />
            ) : (
              <Column
                data={dadosGraficoHora}
                xField="hora"
                yField="quantidade"
                seriesField="tipo"
                height={300}
                isStack={true}
                label={{
                  text: 'quantidade',
                  position: 'inside',
                  style: {
                    fill: '#fff',
                    fontWeight: 'bold',
                    fontSize: 10,
                  },
                }}
                legend={{
                  position: 'top',
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                }}
                yAxis={{
                  tickCount: 5,
                  label: {
                    formatter: (text: string) => {
                      const num = parseFloat(text);
                      return Number.isInteger(num) ? num.toString() : '';
                    },
                  },
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Gráfico de Turnos por Base */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Turnos Diários por Base">
            {loadingGraficoBase ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : dadosGraficoBase.length === 0 ? (
              <Empty description="Nenhum dado disponível" />
            ) : (
              <Column
                data={dadosGraficoBase}
                xField="base"
                yField="quantidade"
                height={300}
                columnWidthRatio={0.3}
                label={{
                  text: 'quantidade',
                  position: 'top',
                  style: {
                    fill: '#000',
                    fontWeight: 'bold',
                  },
                }}
                style={{
                  fill: '#52c41a',
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                }}
                yAxis={{
                  tickCount: 5,
                  label: {
                    formatter: (text: string) => {
                      const num = parseFloat(text);
                      return Number.isInteger(num) ? num.toString() : '';
                    },
                  },
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Tabela de Turnos */}
      <Card>
        <Table
          columns={columns}
          dataSource={turnosAbertos}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} turnos`,
          }}
          locale={{
            emptyText: <Empty description="Nenhum turno aberto no momento" />,
          }}
        />
      </Card>
    </div>
  );
}
