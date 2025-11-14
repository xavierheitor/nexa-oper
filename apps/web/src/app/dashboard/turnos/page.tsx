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
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space, Button, Tooltip, Input, Select } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, CheckOutlined, EnvironmentOutlined, CloseOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { listBases } from '@/lib/actions/base/list';
import ChecklistSelectorModal from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import TurnoLocationMapModal from '@/ui/components/TurnoLocationMapModal';
import FecharTurnoModal from '@/ui/components/FecharTurnoModal';
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
  // Estados para os filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('');
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroBase, setFiltroBase] = useState<string | undefined>(undefined);

  // Estados para os modais de checklist
  const [checklistSelectorVisible, setChecklistSelectorVisible] = useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoData | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistPreenchido | null>(null);

  // Estados para o modal de localização
  const [locationMapVisible, setLocationMapVisible] = useState(false);
  const [selectedTurnoForLocation, setSelectedTurnoForLocation] = useState<TurnoData | null>(null);

  // Estados para o modal de fechar turno
  const [fecharTurnoVisible, setFecharTurnoVisible] = useState(false);
  const [selectedTurnoParaFechar, setSelectedTurnoParaFechar] = useState<TurnoData | null>(null);

  // Fetch de turnos abertos e totais do dia
  const { data: turnosAbertosResult, loading: loadingTurnos, refetch: refetchTurnos } = useDataFetch<{
    turnosAbertos: TurnoData[];
    totalDiarios: number;
  }>(
    async () => {
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

      const [resultAbertos, resultTodos] = await Promise.all([
        listTurnos({ page: 1, pageSize: 1000, status: 'ABERTO' }),
        listTurnos({ page: 1, pageSize: 1000, dataInicio: inicioHoje, dataFim: fimHoje }),
      ]);

      if (resultAbertos.success && resultAbertos.data && resultTodos.success && resultTodos.data) {
        return {
          turnosAbertos: (resultAbertos.data.data || []) as unknown as TurnoData[],
          totalDiarios: resultTodos.data.data?.length || 0,
        };
      }

      throw new Error('Erro ao carregar turnos');
    },
    []
  );

  // Processar dados dos turnos, aplicar filtros e calcular estatísticas
  const { turnosAbertos, turnosFiltrados, stats } = useMemo(() => {
    const turnos = turnosAbertosResult?.turnosAbertos || [];
    const totalDiarios = turnosAbertosResult?.totalDiarios || 0;

    // Aplicar filtros
    let turnosFiltrados = turnos;

    // Filtro por veículo (placa ou modelo)
    if (filtroVeiculo) {
      const filtroLower = filtroVeiculo.toLowerCase();
      turnosFiltrados = turnosFiltrados.filter((turno: TurnoData) =>
        turno.veiculoPlaca?.toLowerCase().includes(filtroLower) ||
        turno.veiculoModelo?.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por equipe
    if (filtroEquipe) {
      const filtroLower = filtroEquipe.toLowerCase();
      turnosFiltrados = turnosFiltrados.filter((turno: TurnoData) =>
        turno.equipeNome?.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por eletricista (nome ou matrícula)
    if (filtroEletricista) {
      const filtroLower = filtroEletricista.toLowerCase();
      turnosFiltrados = turnosFiltrados.filter((turno: TurnoData) =>
        turno.eletricistas?.some((elet) =>
          elet.nome?.toLowerCase().includes(filtroLower) ||
          elet.matricula?.toLowerCase().includes(filtroLower)
        )
      );
    }

    // Filtro por base
    if (filtroBase) {
      turnosFiltrados = turnosFiltrados.filter((turno: TurnoData) =>
        turno.baseNome === filtroBase
      );
    }

    // Calcular estatísticas por base (dos turnos originais, não filtrados)
    const porBase: Record<string, number> = {};
    turnos.forEach((turno: TurnoData) => {
      const base = turno.baseNome || 'Não identificada';
      porBase[base] = (porBase[base] || 0) + 1;
    });

    return {
      turnosAbertos: turnos,
      turnosFiltrados,
      stats: {
        total: turnos.length,
        totalDiarios,
        porBase,
      },
    };
  }, [turnosAbertosResult, filtroVeiculo, filtroEquipe, filtroEletricista, filtroBase]);

  // Fetch de gráfico por tipo de equipe
  const { data: dadosGrafico, loading: loadingGrafico, refetch: refetchGrafico } = useDataFetch<DadosGraficoTipoEquipe[]>(
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
  const { data: dadosGraficoHora, loading: loadingGraficoHora, refetch: refetchGraficoHora } = useDataFetch<DadosGraficoHora[]>(
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
  const { data: dadosGraficoBase, loading: loadingGraficoBase, refetch: refetchGraficoBase } = useDataFetch<DadosGraficoBase[]>(
    async () => {
      const result = await getStatsByBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico por base');
    },
    []
  );

  // Fetch de bases para o select
  const { data: basesData, loading: loadingBases } = useDataFetch<Array<{ id: number; nome: string }>>(
    async () => {
      const result = await listBases({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' });
      if (result.success && result.data) {
        return result.data.data || [];
      }
      throw new Error(result.error || 'Erro ao carregar bases');
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

  const handleViewLocation = (turno: TurnoData) => {
    setSelectedTurnoForLocation(turno);
    setLocationMapVisible(true);
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

  const handleFecharTurno = (turno: TurnoData) => {
    // Só permitir fechar turnos que ainda estão abertos
    if (turno.dataFim) {
      return;
    }
    setSelectedTurnoParaFechar(turno);
    setFecharTurnoVisible(true);
  };

  const handleCloseFecharTurno = () => {
    setFecharTurnoVisible(false);
    setSelectedTurnoParaFechar(null);
  };

  const handleFecharTurnoSuccess = async () => {
    // Atualizar os dados após fechar o turno usando refetch
    await Promise.all([
      refetchTurnos(),
      refetchGrafico(),
      refetchGraficoHora(),
      refetchGraficoBase(),
    ]);
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
      width: 220,
      render: (_: unknown, record: TurnoData) => (
        <Space>
          <Tooltip title="Ver Checklists">
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleViewChecklists(record)}
            />
          </Tooltip>
          <Tooltip title="Ver Histórico de Localização">
            <Button
              type="default"
              size="small"
              icon={<EnvironmentOutlined />}
              onClick={() => handleViewLocation(record)}
            />
          </Tooltip>
          {!record.dataFim && (
            <Tooltip title="Fechar Turno">
              <Button
                type="default"
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleFecharTurno(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  if (loading && !turnosAbertosResult?.turnosAbertos?.length) {
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
        {/* Filtros */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filtrar por veículo (placa/modelo)"
              prefix={<SearchOutlined />}
              value={filtroVeiculo}
              onChange={(e) => setFiltroVeiculo(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filtrar por equipe"
              prefix={<SearchOutlined />}
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Filtrar por eletricista (nome/matrícula)"
              prefix={<SearchOutlined />}
              value={filtroEletricista}
              onChange={(e) => setFiltroEletricista(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filtrar por base"
              style={{ width: '100%' }}
              value={filtroBase}
              onChange={setFiltroBase}
              allowClear
              showSearch
              optionFilterProp="children"
              loading={loadingBases}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={basesData?.map((base) => ({
                label: base.nome,
                value: base.nome,
              }))}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={turnosFiltrados}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total de ${total} turno${total !== 1 ? 's' : ''}${filtroVeiculo || filtroEquipe || filtroEletricista || filtroBase ? ' (filtrado)' : ''}`,
          }}
          locale={{
            emptyText: <Empty description="Nenhum turno encontrado com os filtros aplicados" />,
          }}
        />
      </Card>

      {/* Modal de Localização */}
      <TurnoLocationMapModal
        visible={locationMapVisible}
        onClose={() => {
          setLocationMapVisible(false);
          setSelectedTurnoForLocation(null);
        }}
        turnoId={selectedTurnoForLocation?.id || 0}
        turnoInfo={selectedTurnoForLocation ? {
          id: selectedTurnoForLocation.id,
          veiculo: { placa: selectedTurnoForLocation.veiculoPlaca },
          equipe: { nome: selectedTurnoForLocation.equipeNome },
        } : undefined}
      />

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

      {/* Modal de Fechar Turno */}
      <FecharTurnoModal
        visible={fecharTurnoVisible}
        onClose={handleCloseFecharTurno}
        turno={selectedTurnoParaFechar}
        onSuccess={handleFecharTurnoSuccess}
      />
    </div>
  );
}
