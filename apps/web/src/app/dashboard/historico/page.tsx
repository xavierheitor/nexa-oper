'use client';

/**
 * Página de Histórico de Turnos
 *
 * Dashboard para visualizar histórico de turnos de uma data específica,
 * incluindo estatísticas e gráficos relacionados ao dia selecionado.
 */

import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space, DatePicker, Button } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

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

export default function HistoricoPage() {
  const [turnosHistorico, setTurnosHistorico] = useState<TurnoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrafico, setLoadingGrafico] = useState(false);
  const [loadingGraficoHora, setLoadingGraficoHora] = useState(false);
  const [loadingGraficoBase, setLoadingGraficoBase] = useState(false);
  const [dadosGrafico, setDadosGrafico] = useState<DadosGraficoTipoEquipe[]>([]);
  const [dadosGraficoHora, setDadosGraficoHora] = useState<DadosGraficoHora[]>([]);
  const [dadosGraficoBase, setDadosGraficoBase] = useState<DadosGraficoBase[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    totalAbertos: 0,
    totalFechados: 0,
    porBase: {} as Record<string, number>,
  });
  const [dataSelecionada, setDataSelecionada] = useState<dayjs.Dayjs>(dayjs());

  const buscarHistorico = async (data: dayjs.Dayjs) => {
    setLoading(true);
    try {
      // Definir período do dia selecionado (00:00:00 até 23:59:59)
      const inicioDia = data.startOf('day').toDate();
      const fimDia = data.endOf('day').toDate();

      // Buscar todos os turnos do dia selecionado
      const result = await listTurnos({
        page: 1,
        pageSize: 1000,
        dataInicio: inicioDia,
        dataFim: fimDia,
      });

      if (result.success && result.data) {
        const turnos = result.data.data || [];
        setTurnosHistorico(turnos);

        // Calcular estatísticas
        const porBase: Record<string, number> = {};
        let totalAbertos = 0;
        let totalFechados = 0;

        turnos.forEach((turno: any) => {
          const base = turno.equipeNome?.split('-')[0] || 'Não identificada';
          porBase[base] = (porBase[base] || 0) + 1;

          if (turno.dataFim) {
            totalFechados++;
          } else {
            totalAbertos++;
          }
        });

        setStats({
          total: turnos.length,
          totalAbertos,
          totalFechados,
          porBase,
        });
      } else if (result.redirectToLogin) {
        window.location.href = '/login';
        return;
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarGraficos = async () => {
    setLoadingGrafico(true);
    setLoadingGraficoHora(true);
    setLoadingGraficoBase(true);

    try {
      // Buscar dados dos gráficos
      const [resultTipo, resultHora, resultBase] = await Promise.all([
        getStatsByTipoEquipe(),
        getStatsByHoraETipoEquipe(),
        getStatsByBase(),
      ]);

      if (resultTipo.success && resultTipo.data) {
        setDadosGrafico(resultTipo.data);
      }
      setLoadingGrafico(false);

      if (resultHora.success && resultHora.data) {
        setDadosGraficoHora(resultHora.data);
      }
      setLoadingGraficoHora(false);

      if (resultBase.success && resultBase.data) {
        setDadosGraficoBase(resultBase.data);
      }
      setLoadingGraficoBase(false);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
      setLoadingGrafico(false);
      setLoadingGraficoHora(false);
      setLoadingGraficoBase(false);
    }
  };

  useEffect(() => {
    // Carregar dados iniciais (hoje)
    buscarHistorico(dataSelecionada);
    buscarGraficos();
  }, []);

  const handleDataChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setDataSelecionada(date);
      buscarHistorico(date);
    }
  };

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
      title: 'Data/Hora Fim',
      key: 'dataFim',
      render: (_: unknown, record: TurnoData) => {
        if (!record.dataFim) return <span>-</span>;
        const data = new Date(record.dataFim);
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

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Histórico de Turnos</Title>

      {/* Seletor de Data */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <span style={{ fontWeight: 'bold' }}>Selecionar Data:</span>
          </Col>
          <Col>
            <DatePicker
              value={dataSelecionada}
              onChange={handleDataChange}
              format="DD/MM/YYYY"
              placeholder="Selecione uma data"
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => buscarHistorico(dataSelecionada)}
              loading={loading}
            >
              Buscar
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Estatísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={`Total de Turnos - ${dataSelecionada.format('DD/MM/YYYY')}`}
              value={stats.total}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Turnos Abertos"
              value={stats.totalAbertos}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Turnos Fechados"
              value={stats.totalFechados}
              prefix={<ClockCircleOutlined />}
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

      {/* Tabela de Histórico */}
      <Card>
        <Table
          columns={columns}
          dataSource={turnosHistorico}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} turnos em ${dataSelecionada.format('DD/MM/YYYY')}`,
          }}
          locale={{
            emptyText: <Empty description={`Nenhum turno encontrado para ${dataSelecionada.format('DD/MM/YYYY')}`} />,
          }}
        />
      </Card>
    </div>
  );
}
