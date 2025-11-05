'use client';

/**
 * Página de Turnos
 *
 * Dashboard com informações sobre turnos abertos, incluindo:
 * - Total de turnos abertos
 * - Turnos abertos por base
 * - Tabela com detalhes dos turnos abertos
 */

import React, { useState, useMemo } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space, Button, Tooltip } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import ChecklistSelectorModal from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import type { ChecklistPreenchido } from '@/ui/components/ChecklistSelectorModal';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

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
  // Estados para os modais de checklist
  const [checklistSelectorVisible, setChecklistSelectorVisible] = useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoData | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistPreenchido | null>(null);

  // Fetch de turnos abertos e totais do dia
  const { data: turnosAbertosResult, loading: loadingTurnos } = useDataFetch(
    async () => {
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      const [resultAbertos, resultTodos] = await Promise.all([
        listTurnos({ page: 1, pageSize: 1000, status: 'ABERTO' }),
        listTurnos({ page: 1, pageSize: 1000, dataInicio: inicioHoje, dataFim: fimHoje }),
      ]);

      if (resultAbertos.redirectToLogin) {
        window.location.href = '/login';
        return { success: false as const, error: 'Redirecionando para login' };
      }

      if (resultAbertos.success && resultAbertos.data && resultTodos.success && resultTodos.data) {
        return {
          success: true as const,
          data: {
            turnosAbertos: (resultAbertos.data.data || []) as unknown as TurnoData[],
            totalDiarios: resultTodos.data.data?.length || 0,
          },
        };
      }

      return { success: false as const, error: 'Erro ao carregar turnos' };
    },
    []
  );

  // Processar dados dos turnos e calcular estatísticas
  const { turnosAbertos, stats } = useMemo(() => {
    const turnos = turnosAbertosResult?.data?.turnosAbertos || [];
    const totalDiarios = turnosAbertosResult?.data?.totalDiarios || 0;

    // Calcular estatísticas por base
    const porBase: Record<string, number> = {};
    turnos.forEach((turno: TurnoData) => {
      const base = turno.equipeNome?.split('-')[0] || 'Não identificada';
      porBase[base] = (porBase[base] || 0) + 1;
    });

    return {
      turnosAbertos: turnos,
      stats: {
        total: turnos.length,
        totalDiarios,
        porBase,
      },
    };
  }, [turnosAbertosResult]);

  // Fetch de gráfico por tipo de equipe
  const { data: dadosGrafico, loading: loadingGrafico } = useDataFetch<DadosGraficoTipoEquipe[]>(
    async () => {
      const result = await getStatsByTipoEquipe();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico');
    },
    []
  );

  // Fetch de gráfico por hora e tipo
  const { data: dadosGraficoHora, loading: loadingGraficoHora } = useDataFetch<DadosGraficoHora[]>(
    async () => {
      const result = await getStatsByHoraETipoEquipe();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico por hora');
    },
    []
  );

  // Fetch de gráfico por base
  const { data: dadosGraficoBase, loading: loadingGraficoBase } = useDataFetch<DadosGraficoBase[]>(
    async () => {
      const result = await getStatsByBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico por base');
    },
    []
  );

  // Loading geral (qualquer um dos fetches)
  const loading = loadingTurnos || loadingGrafico || loadingGraficoHora || loadingGraficoBase;

  // Funções para lidar com os modais de checklist
  const handleViewChecklists = (turno: TurnoData) => {
    setSelectedTurno(turno);
    setChecklistSelectorVisible(true);
  };

  const handleSelectChecklist = (checklist: ChecklistPreenchido) => {
    setSelectedChecklist(checklist);
    setChecklistViewerVisible(true);
  };

  const handleCloseChecklistSelector = () => {
    setChecklistSelectorVisible(false);
    setSelectedTurno(null);
  };

  const handleCloseChecklistViewer = () => {
    setChecklistViewerVisible(false);
    setSelectedChecklist(null);
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
            <Tooltip key={elet.id} title={`Matrícula: ${elet.matricula}`}>
              <span style={{ cursor: 'help' }}>{elet.nome}</span>
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
    {
      title: 'Ações',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: TurnoData) => (
        <Tooltip title="Ver Checklists">
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleViewChecklists(record)}
          />
        </Tooltip>
      ),
    },
  ];

  if (loading && !turnosAbertos.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Formatar data de referência (hoje) para exibição no título
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        Turnos Abertos - Hoje ({dataFormatada})
      </Title>

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
            ) : !dadosGrafico || dadosGrafico.length === 0 ? (
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
            ) : !dadosGraficoHora || dadosGraficoHora.length === 0 ? (
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
            ) : !dadosGraficoBase || dadosGraficoBase.length === 0 ? (
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

      {/* Modais de Checklist */}
      <ChecklistSelectorModal
        visible={checklistSelectorVisible}
        onClose={handleCloseChecklistSelector}
        turnoId={selectedTurno?.id || 0}
        turnoInfo={{
          veiculoPlaca: selectedTurno?.veiculoPlaca || '',
          equipeNome: selectedTurno?.equipeNome || '',
          dataInicio: selectedTurno?.dataInicio || '',
        }}
        onSelectChecklist={handleSelectChecklist}
      />

      <ChecklistViewerModal
        visible={checklistViewerVisible}
        onClose={handleCloseChecklistViewer}
        checklist={selectedChecklist}
      />
    </div>
  );
}
