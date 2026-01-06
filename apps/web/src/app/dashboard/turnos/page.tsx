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
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import { ClockCircleOutlined, CalendarOutlined, CheckOutlined, EnvironmentOutlined, CloseOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { getTurnosPrevistosHoje } from '@/lib/actions/turno/getTurnosPrevistos';
import { getEstatisticasTurnosPrevistos } from '@/lib/actions/turno/getEstatisticasTurnosPrevistos';
import type { TurnoPrevisto, EstatisticasTurnosPrevistos } from '@/lib/types/turnoPrevisto';
import { formatTime } from '@/lib/utils/turnoPrevistoHelpers';
import ChecklistSelectorModal from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import TurnoLocationMapModal from '@/ui/components/TurnoLocationMapModal';
import FecharTurnoModal from '@/ui/components/FecharTurnoModal';
import type { ChecklistPreenchido } from '@/ui/components/ChecklistSelectorModal';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useTablePagination } from '@/lib/hooks/useTablePagination';

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
  tipo: string;
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
    motorista?: boolean;
  }>;
}

export default function TurnosPage() {
  // Estados para os filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('');
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroBase, setFiltroBase] = useState<string | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<string | undefined>(undefined);

  // Hook para paginação client-side da tabela principal
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
    showTotal: (total) => `Total de ${total} turno${total !== 1 ? 's' : ''}${filtroVeiculo || filtroEquipe || filtroEletricista || filtroBase || filtroTipoEquipe ? ' (filtrado)' : ''}`,
  });

  // Hook para paginação da tabela de turnos não abertos
  const { pagination: paginationNaoAbertos } = useTablePagination({
    defaultPageSize: 10,
    showTotal: (total) => `Total de ${total} turno${total !== 1 ? 's' : ''} não aberto${total !== 1 ? 's' : ''}`,
  });

  // Hook para paginação da tabela detalhada de turnos previstos
  const { pagination: paginationTurnosPrevistos } = useTablePagination({
    defaultPageSize: 20,
    showTotal: (total) => `Total de ${total} turno${total !== 1 ? 's' : ''} previsto${total !== 1 ? 's' : ''}`,
  });

  // Hook para paginação da tabela de turnos previstos futuros
  const { pagination: paginationTurnosFuturos } = useTablePagination({
    defaultPageSize: 10,
    showTotal: (total) => `Total de ${total} turno${total !== 1 ? 's' : ''} previsto${total !== 1 ? 's' : ''} para o resto do dia`,
  });

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
  const { data: turnosAbertosResult, loading: loadingTurnos, error: errorTurnos, refetch: refetchTurnos } = useDataFetch<{
    turnosAbertos: TurnoData[];
    totalDiarios: number;
  }>(
    async () => {
      // Usar getTodayDateRange para garantir timezone correto (São Paulo)
      const { getTodayDateRange } = await import('@/lib/utils/dateHelpers');
      const { inicio: inicioHoje, fim: fimHoje } = getTodayDateRange();

      const [resultAbertos, resultTodos] = await Promise.all([
        listTurnos({ page: 1, pageSize: 1000, status: 'ABERTO' }),
        listTurnos({ page: 1, pageSize: 1000, dataInicio: inicioHoje, dataFim: fimHoje }),
      ]);

      if (resultAbertos.success && resultAbertos.data && resultTodos.success && resultTodos.data) {
        // Mapear turnos do formato Prisma para TurnoData
        const turnosAbertos: TurnoData[] = (resultAbertos.data.data || []).map((turno) => ({
          id: turno.id,
          dataSolicitacao: turno.dataSolicitacao instanceof Date
            ? turno.dataSolicitacao.toISOString()
            : String(turno.dataSolicitacao),
          dataInicio: turno.dataInicio instanceof Date
            ? turno.dataInicio.toISOString()
            : String(turno.dataInicio),
          dataFim: turno.dataFim
            ? (turno.dataFim instanceof Date ? turno.dataFim.toISOString() : String(turno.dataFim))
            : undefined,
          veiculoId: turno.veiculoId,
          veiculoPlaca: (turno as { veiculoPlaca?: string }).veiculoPlaca || 'N/A',
          veiculoModelo: (turno as { veiculoModelo?: string }).veiculoModelo || 'N/A',
          equipeId: turno.equipeId,
          equipeNome: (turno as { equipeNome?: string }).equipeNome || 'N/A',
          tipoEquipeNome: (turno as { tipoEquipeNome?: string }).tipoEquipeNome || 'N/A',
          baseNome: (turno as { baseNome?: string }).baseNome || 'N/A',
          dispositivo: turno.dispositivo || '',
          kmInicio: turno.kmInicio || 0,
          kmFim: (turno as { KmFim?: number | null }).KmFim ?? undefined,
          status: turno.dataFim ? 'FECHADO' : 'ABERTO',
          eletricistas: ((turno as { eletricistas?: Array<{ id: number; nome: string; matricula: string; motorista?: boolean }> }).eletricistas || []).map((e) => ({
            id: e.id,
            nome: e.nome,
            matricula: e.matricula,
            motorista: e.motorista || false,
          })),
        }));

        return {
          turnosAbertos,
          totalDiarios: resultTodos.data.data?.length || 0,
        };
      }

      throw new Error('Erro ao carregar turnos');
    },
    []
  );

  // Processar dados dos turnos, aplicar filtros e calcular estatísticas
  const { turnosFiltrados, stats } = useMemo(() => {
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

    // Filtro por tipo de equipe
    if (filtroTipoEquipe) {
      turnosFiltrados = turnosFiltrados.filter((turno: TurnoData) =>
        turno.tipoEquipeNome === filtroTipoEquipe
      );
    }

    // Calcular estatísticas por base (dos turnos originais, não filtrados)
    const porBase: Record<string, number> = {};
    turnos.forEach((turno: TurnoData) => {
      const base = turno.baseNome || 'Não identificada';
      porBase[base] = (porBase[base] || 0) + 1;
    });

    return {
      turnosFiltrados,
      stats: {
        total: turnos.length,
        totalDiarios,
        porBase,
      },
    };
  }, [turnosAbertosResult, filtroVeiculo, filtroEquipe, filtroEletricista, filtroBase, filtroTipoEquipe]);

  // Fetch de gráfico por tipo de equipe
  const { data: dadosGrafico, loading: loadingGrafico, error: errorGrafico, refetch: refetchGrafico } = useDataFetch<DadosGraficoTipoEquipe[]>(
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
  const { data: dadosGraficoHora, loading: loadingGraficoHora, error: errorGraficoHora, refetch: refetchGraficoHora } = useDataFetch<DadosGraficoHora[]>(
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
  const { data: dadosGraficoBase, loading: loadingGraficoBase, error: errorGraficoBase, refetch: refetchGraficoBase } = useDataFetch<DadosGraficoBase[]>(
    async () => {
      const result = await getStatsByBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados do gráfico por base');
    },
    []
  );

  // Gerar array de cores na ordem dos tipos (para usar com colorField e scale)
  const coresArray = useMemo(() => {
    const coresDisponiveis = [
      '#1890ff', // Azul
      '#52c41a', // Verde
      '#faad14', // Amarelo/Laranja
      '#f5222d', // Vermelho
      '#722ed1', // Roxo
      '#13c2c2', // Ciano
      '#eb2f96', // Rosa
      '#fa8c16', // Laranja
    ];

    if (dadosGraficoBase && dadosGraficoBase.length > 0) {
      const tiposUnicos = [...new Set(dadosGraficoBase.map(d => d.tipo).filter(Boolean))].sort();
      return tiposUnicos.map((_, index) => coresDisponiveis[index % coresDisponiveis.length]);
    }
    return [];
  }, [dadosGraficoBase]);

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

  // Fetch de tipos de equipe para o select
  const { data: tiposEquipeData, loading: loadingTiposEquipe } = useDataFetch<Array<{ id: number; nome: string }>>(
    async () => {
      const result = await listTiposEquipe({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' });
      if (result.success && result.data) {
        return result.data.data || [];
      }
      throw new Error(result.error || 'Erro ao carregar tipos de equipe');
    },
    []
  );

  // Fetch de turnos previstos
  const { data: turnosPrevistosResult, loading: loadingTurnosPrevistos, refetch: refetchTurnosPrevistos } = useDataFetch<TurnoPrevisto[]>(
    async () => {
      const result = await getTurnosPrevistosHoje();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar turnos previstos');
    },
    []
  );

  // Fetch de estatísticas de turnos previstos
  const { data: statsPrevistosResult, loading: loadingStatsPrevistos, refetch: refetchStatsPrevistos } = useDataFetch<EstatisticasTurnosPrevistos>(
    async () => {
      const result = await getEstatisticasTurnosPrevistos();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar estatísticas de turnos previstos');
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
      refetchTurnosPrevistos(),
      refetchStatsPrevistos(),
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
            <Tooltip key={elet.id} title={`Matrícula: ${elet.matricula}${elet.motorista ? ' - Motorista' : ''}`}>
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
            {data.toLocaleDateString('pt-BR')} {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      title: 'KM Inicial',
      key: 'kmInicio',
      width: 120,
      align: 'right',
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

  // Check de hidratação DEPOIS de todos os hooks, mas ANTES de qualquer return condicional
  const hydrated = useHydrated();

  // Formatar data de referência (hoje) para exibição no título
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (loading && !turnosAbertosResult?.turnosAbertos?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        Turnos Abertos - Hoje ({dataFormatada})
      </Title>

      {/* Tratamento de Erros */}
      <ErrorAlert error={errorTurnos} onRetry={refetchTurnos} />
      <ErrorAlert error={errorGrafico} onRetry={refetchGrafico} />
      <ErrorAlert error={errorGraficoHora} onRetry={refetchGraficoHora} />
      <ErrorAlert error={errorGraficoBase} onRetry={refetchGraficoBase} />

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
                seriesField="tipo"
                isStack={true}
                height={300}
                columnWidthRatio={0.3}
                label={{
                  text: (d: any) => d.quantidade > 0 ? d.quantidade : '',
                  position: 'inside',
                  style: {
                    fill: '#fff',
                    fontWeight: 'bold',
                    fontSize: 10,
                  },
                }}
                colorField="tipo"
                scale={{
                  color: {
                    range: coresArray.length > 0 ? coresArray : ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
                  },
                }}
                legend={{
                  position: 'top',
                  itemName: {
                    formatter: (text: string) => {
                      // Não mostrar na legenda tipos que não têm dados
                      const temDados = dadosGraficoBase?.some(d => d.tipo === text && d.quantidade > 0);
                      return temDados ? text : '';
                    },
                  },
                }}
                xAxis={{
                  label: {
                    autoRotate: true,
                    autoHide: false,
                  },
                  type: 'category',
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
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Veículo"
              prefix={<SearchOutlined />}
              value={filtroVeiculo}
              onChange={(e) => setFiltroVeiculo(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Equipe"
              prefix={<SearchOutlined />}
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder="Eletricista"
              prefix={<SearchOutlined />}
              value={filtroEletricista}
              onChange={(e) => setFiltroEletricista(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Base"
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
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Tipo de Equipe"
              style={{ width: '100%' }}
              value={filtroTipoEquipe}
              onChange={setFiltroTipoEquipe}
              allowClear
              showSearch
              optionFilterProp="children"
              loading={loadingTiposEquipe}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={tiposEquipeData?.map((tipo) => ({
                label: tipo.nome,
                value: tipo.nome,
              }))}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={turnosFiltrados}
          rowKey="id"
          pagination={pagination}
          locale={{
            emptyText: <Empty description="Nenhum turno encontrado com os filtros aplicados" />,
          }}
        />
      </Card>

      {/* Card de Turnos Não Abertos - Apenas os que já deveriam ter sido abertos */}
      {loadingTurnosPrevistos ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            </Card>
          </Col>
        </Row>
      ) : turnosPrevistosResult ? (
        (() => {
          const agora = new Date();
          const horaAtual = agora.getHours() * 60 + agora.getMinutes(); // Minutos desde meia-noite

          // Função para converter horário "HH:MM:SS" para minutos desde meia-noite
          const horarioParaMinutos = (horario: string | null): number | null => {
            if (!horario) return null;
            const [hora, minuto] = horario.split(':').map(Number);
            if (isNaN(hora) || isNaN(minuto)) return null;
            return hora * 60 + minuto;
          };

          // Filtrar turnos não abertos que já passaram do horário previsto
          const turnosNaoAbertosAtrasados = turnosPrevistosResult.filter((tp) => {
            if (tp.status !== 'NAO_ABERTO') return false;
            if (!tp.horarioPrevisto) return true; // Se não tem horário previsto, considerar atrasado
            const minutosPrevistos = horarioParaMinutos(tp.horarioPrevisto);
            if (minutosPrevistos === null) return true;
            return minutosPrevistos <= horaAtual; // Já passou do horário previsto
          });

          // Filtrar turnos previstos que ainda não passaram do horário
          const turnosPrevistosFuturos = turnosPrevistosResult.filter((tp) => {
            if (tp.status !== 'NAO_ABERTO') return false;
            if (!tp.horarioPrevisto) return false; // Se não tem horário, não mostrar aqui
            const minutosPrevistos = horarioParaMinutos(tp.horarioPrevisto);
            if (minutosPrevistos === null) return false;
            return minutosPrevistos > horaAtual; // Ainda não passou do horário previsto
          });

          return (
            <>
              {/* Card de Turnos Atrasados (já deveriam ter sido abertos) */}
              {turnosNaoAbertosAtrasados.length > 0 && (
                <Card
                  title={
                    <Space>
                      <span>Turnos Previstos Não Abertos (Atrasados)</span>
                      <Tag color="error">{turnosNaoAbertosAtrasados.length}</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 32 }}
                  extra={
                    <Tag color="error">
                      Deveriam ter sido abertos até agora
                    </Tag>
                  }
                >
                  <Table
                    dataSource={turnosNaoAbertosAtrasados}
                    rowKey={(record) => `${record.equipeId}-${record.status}`}
                    pagination={paginationNaoAbertos}
                    size="small"
                    columns={[
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
                        render: (horario: string | null) => formatTime(horario) || '-',
                      },
                      {
                        title: 'Eletricistas',
                        key: 'eletricistas',
                        render: (_: unknown, record: TurnoPrevisto) => (
                          <Space direction="vertical" size={0}>
                            {record.eletricistas.map((el) => (
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
              )}

              {/* Card de Turnos Previstos para o Resto do Dia */}
              {turnosPrevistosFuturos.length > 0 && (
                <Card
                  title={
                    <Space>
                      <span>Turnos Previstos para o Resto do Dia</span>
                      <Tag color="blue">{turnosPrevistosFuturos.length}</Tag>
                    </Space>
                  }
                  style={{ marginBottom: 24 }}
                  extra={
                    <Tag color="processing">
                      Ainda não passou do horário previsto
                    </Tag>
                  }
                >
                  <Table
                    dataSource={turnosPrevistosFuturos}
                    rowKey={(record) => `${record.equipeId}-${record.status}-futuro`}
                    pagination={paginationTurnosFuturos}
                    size="small"
                    columns={[
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
                        render: (horario: string | null) => formatTime(horario) || '-',
                      },
                      {
                        title: 'Eletricistas',
                        key: 'eletricistas',
                        render: (_: unknown, record: TurnoPrevisto) => (
                          <Space direction="vertical" size={0}>
                            {record.eletricistas.map((el) => (
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
              )}
            </>
          );
        })()
      ) : null}

      {/* Seção de Turnos Previstos */}
      {loadingStatsPrevistos ? (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            </Card>
          </Col>
        </Row>
      ) : statsPrevistosResult ? (
        <>
          {/* Cards de Estatísticas de Turnos Previstos */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Title level={3}>Turnos Previstos (Baseado em Escala)</Title>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Turnos Previstos Hoje"
                  value={statsPrevistosResult.totalPrevistosHoje}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Já Abertos"
                  value={statsPrevistosResult.totalAbertos}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Não Abertos"
                  value={statsPrevistosResult.totalNaoAbertos}
                  valueStyle={{ color: '#f5222d' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Aderentes"
                  value={statsPrevistosResult.totalAderentes}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Não Aderentes"
                  value={statsPrevistosResult.totalNaoAderentes}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Turnos Extras"
                  value={statsPrevistosResult.totalTurnosExtras}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Previstos até Agora"
                  value={statsPrevistosResult.previstosAteAgora}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6} lg={3}>
              <Card>
                <Statistic
                  title="Abertos até Agora"
                  value={statsPrevistosResult.abertosAteAgora}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Resumo por Tipo de Equipe */}
          {statsPrevistosResult.porTipoEquipe.length > 0 && (
            <Card title="Turnos Previstos por Tipo de Equipe" style={{ marginBottom: 24 }}>
              <Table
                dataSource={statsPrevistosResult.porTipoEquipe}
                rowKey="tipoEquipeId"
                pagination={false}
                columns={[
                  {
                    title: 'Tipo de Equipe',
                    dataIndex: 'tipoEquipeNome',
                    key: 'tipoEquipeNome',
                  },
                  {
                    title: 'Previstos',
                    dataIndex: 'previstos',
                    key: 'previstos',
                    align: 'center',
                  },
                  {
                    title: 'Abertos',
                    dataIndex: 'abertos',
                    key: 'abertos',
                    align: 'center',
                    render: (value: number) => (
                      <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{value}</span>
                    ),
                  },
                  {
                    title: 'Não Abertos',
                    dataIndex: 'naoAbertos',
                    key: 'naoAbertos',
                    align: 'center',
                    render: (value: number) => (
                      <span style={{ color: '#f5222d', fontWeight: 'bold' }}>{value}</span>
                    ),
                  },
                ]}
              />
            </Card>
          )}

          {/* Tabela Detalhada de Turnos Previstos */}
          {turnosPrevistosResult && turnosPrevistosResult.length > 0 && (
            <Card title="Detalhamento de Turnos Previstos" style={{ marginBottom: 24 }}>
              <Table
                dataSource={turnosPrevistosResult}
                rowKey={(record) => `${record.equipeId}-${record.status}-${record.turnoId || 'no-turno'}`}
                pagination={paginationTurnosPrevistos}
                columns={[
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
                    render: (horario: string | null) => formatTime(horario),
                  },
                  {
                    title: 'Eletricistas',
                    key: 'eletricistas',
                    render: (_: unknown, record: TurnoPrevisto) => (
                      <Space direction="vertical" size={0}>
                        {record.eletricistas.map((el) => (
                          <span key={el.id}>
                            {el.nome} ({el.matricula})
                          </span>
                        ))}
                      </Space>
                    ),
                  },
                  {
                    title: 'Status',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: TurnoPrevisto['status'], record: TurnoPrevisto) => {
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
          )}
        </>
      ) : null}

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
