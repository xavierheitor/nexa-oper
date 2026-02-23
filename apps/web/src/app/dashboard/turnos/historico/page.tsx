'use client';

/**
 * Página de Histórico de Turnos
 *
 * Dashboard para visualizar histórico de turnos de uma data específica,
 * incluindo estatísticas e gráficos relacionados ao dia selecionado.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Spin,
  Empty,
  Typography,
  Space,
  DatePicker,
  Button,
  Tooltip,
  Input,
  Select,
} from 'antd';
import {
  CalendarOutlined,
  SearchOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  CarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { getDailyStats } from '@/lib/actions/turno/getDailyStats';
import { listBases } from '@/lib/actions/base/list';
import ChecklistSelectorModal, {
  type ChecklistPreenchido,
} from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import TurnoLocationMapModal from '@/ui/components/TurnoLocationMapModal';
import FecharTurnoModal from '@/ui/components/FecharTurnoModal';
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { getDateRangeInSaoPaulo } from '@/lib/utils/dateHelpers';
import { handleRedirectToLogin } from '@/lib/utils/redirectHandler';
import dayjs from 'dayjs';

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

import { TurnoData } from '@/lib/types/turno-frontend';
import { mapTurnoToTurnoData } from '@/lib/mappers/turnoMapper';

export default function HistoricoPage() {
  // Estados para os filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('');
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroBase, setFiltroBase] = useState<string | undefined>(undefined);

  // Hook para paginação client-side
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
    showTotal: total =>
      `Total de ${total} turno${total !== 1 ? 's' : ''} em ${dataSelecionada.format('DD/MM/YYYY')}${filtroVeiculo || filtroEquipe || filtroEletricista || filtroBase ? ' (filtrado)' : ''}`,
  });

  const [turnosHistorico, setTurnosHistorico] = useState<TurnoData[]>([]);
  const { loading, setLoading } = useLoadingStates({
    main: false,
    grafico: false,
    graficoHora: false,
    graficoBase: false,
  });
  const [dadosGrafico, setDadosGrafico] = useState<DadosGraficoTipoEquipe[]>(
    []
  );
  const [dadosGraficoHora, setDadosGraficoHora] = useState<DadosGraficoHora[]>(
    []
  );
  const [dadosGraficoBase, setDadosGraficoBase] = useState<DadosGraficoBase[]>(
    []
  );
  const [stats, setStats] = useState({
    total: 0,
    totalAbertos: 0,
    totalFechados: 0,
    porBase: {} as Record<string, number>,
  });
  const [dataSelecionada, setDataSelecionada] = useState<dayjs.Dayjs>(dayjs());

  // Estados para os modais de checklist
  const [checklistSelectorVisible, setChecklistSelectorVisible] =
    useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoData | null>(null);
  const [selectedChecklist, setSelectedChecklist] =
    useState<ChecklistPreenchido | null>(null);

  // Estados para o modal de localização
  const [locationMapVisible, setLocationMapVisible] = useState(false);
  const [selectedTurnoForLocation, setSelectedTurnoForLocation] =
    useState<TurnoData | null>(null);

  // Estados para o modal de fechar turno
  const [fecharTurnoVisible, setFecharTurnoVisible] = useState(false);
  const [selectedTurnoParaFechar, setSelectedTurnoParaFechar] =
    useState<TurnoData | null>(null);

  const buscarHistorico = useCallback(
    async (data: dayjs.Dayjs) => {
      setLoading('main', true);
      try {
        const { inicio: inicioDia, fim: fimDia } = getDateRangeInSaoPaulo(
          data.toDate()
        );

        // Buscar todos os turnos do dia selecionado
        const result = await listTurnos({
          page: 1,
          pageSize: 1000,
          dataInicio: inicioDia,
          dataFim: fimDia,
        });

        if (result.success && result.data) {
          const turnos = result.data.data || [];
          const turnosMapeados: TurnoData[] = turnos.map(mapTurnoToTurnoData);
          setTurnosHistorico(turnosMapeados);
        } else if (handleRedirectToLogin(result)) {
          return;
        }
      } catch (error) {
        console.error('Erro ao carregar histórico de turnos:', error);
      } finally {
        setLoading('main', false);
      }
    },
    [setLoading]
  );

  const buscarGraficos = useCallback(
    async (data: dayjs.Dayjs) => {
      setLoading('grafico', true);
      setLoading('graficoHora', true);
      setLoading('graficoBase', true);

      try {
        const dateStr = data.toISOString();

        // Executar todas as actions em paralelo
        const [statsTipoEquipe, statsHora, statsBase, dailyStats] =
          await Promise.all([
            getStatsByTipoEquipe({ date: dateStr }),
            getStatsByHoraETipoEquipe({ date: dateStr }),
            getStatsByBase({ date: dateStr }),
            getDailyStats({ date: dateStr }),
          ]);

        if (statsTipoEquipe.success && statsTipoEquipe.data) {
          setDadosGrafico(statsTipoEquipe.data);
        }

        if (statsHora.success && statsHora.data) {
          setDadosGraficoHora(statsHora.data);
        }

        if (statsBase.success && statsBase.data) {
          setDadosGraficoBase(statsBase.data);
        }

        if (dailyStats.success && dailyStats.data) {
          setStats(dailyStats.data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados dos gráficos:', error);
      } finally {
        setLoading('grafico', false);
        setLoading('graficoHora', false);
        setLoading('graficoBase', false);
      }
    },
    [setLoading]
  );

  useEffect(() => {
    // Carregar dados iniciais (hoje)
    buscarHistorico(dataSelecionada);
    buscarGraficos(dataSelecionada);
  }, [dataSelecionada, buscarHistorico, buscarGraficos]);

  const handleDataChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setDataSelecionada(date);
    }
  };

  // Funções para lidar com os modais de checklist
  const handleViewChecklists = (turno: TurnoData) => {
    setSelectedTurno(turno);
    setChecklistSelectorVisible(true);
  };

  const handleViewLocation = (turno: TurnoData) => {
    setSelectedTurnoForLocation(turno);
    setLocationMapVisible(true);
  };

  const handleSelectChecklist = (checklist: any) => {
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
    // Recarregar os dados após fechar o turno
    await Promise.all([
      buscarHistorico(dataSelecionada),
      buscarGraficos(dataSelecionada),
    ]);
  };

  // Fetch de bases para o select
  const { data: basesData, loading: loadingBases } = useDataFetch<
    Array<{ id: number; nome: string }>
  >(async () => {
    const result = await listBases({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    });
    if (result.success && result.data) {
      return result.data.data || [];
    }
    throw new Error(result.error || 'Erro ao carregar bases');
  }, []);

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
      const tiposUnicos = [
        ...new Set(dadosGraficoBase.map(d => d.tipo).filter(Boolean)),
      ].sort();
      return tiposUnicos.map(
        (_, index) => coresDisponiveis[index % coresDisponiveis.length]
      );
    }
    return [];
  }, [dadosGraficoBase]);

  // Aplicar filtros aos turnos do histórico (ANTES do check de hidratação para seguir regras dos Hooks)
  const turnosFiltrados = useMemo(() => {
    let turnos = turnosHistorico;

    // Filtro por veículo (placa ou modelo)
    if (filtroVeiculo) {
      const filtroLower = filtroVeiculo.toLowerCase();
      turnos = turnos.filter(
        (turno: TurnoData) =>
          turno.veiculoPlaca?.toLowerCase().includes(filtroLower) ||
          turno.veiculoModelo?.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por equipe
    if (filtroEquipe) {
      const filtroLower = filtroEquipe.toLowerCase();
      turnos = turnos.filter((turno: TurnoData) =>
        turno.equipeNome?.toLowerCase().includes(filtroLower)
      );
    }

    // Filtro por eletricista (nome ou matrícula)
    if (filtroEletricista) {
      const filtroLower = filtroEletricista.toLowerCase();
      turnos = turnos.filter((turno: TurnoData) =>
        turno.eletricistas?.some(
          elet =>
            elet.nome?.toLowerCase().includes(filtroLower) ||
            elet.matricula?.toLowerCase().includes(filtroLower)
        )
      );
    }

    // Filtro por base
    if (filtroBase) {
      turnos = turnos.filter(
        (turno: TurnoData) => turno.baseNome === filtroBase
      );
    }

    return turnos;
  }, [
    turnosHistorico,
    filtroVeiculo,
    filtroEquipe,
    filtroEletricista,
    filtroBase,
  ]);

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Spin size='large' />
      </div>
    );
  }

  const columns: ColumnsType<TurnoData> = [
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
      title: 'Data/Hora Fim',
      key: 'dataFim',
      render: (_: unknown, record: TurnoData) => {
        if (!record.dataFim) return <span>-</span>;
        const data = new Date(record.dataFim);
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
      align: 'right',
      render: (_: unknown, record: TurnoData) => (
        <span>{record.kmInicio?.toLocaleString('pt-BR') || '-'}</span>
      ),
    },
    {
      title: 'KM Final',
      key: 'kmFim',
      width: 120,
      align: 'right',
      render: (_: unknown, record: TurnoData) => (
        <span>{record.kmFim?.toLocaleString('pt-BR') || '-'}</span>
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
      width: 220,
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
    <div style={{ padding: '24px' }}>
      <Title level={2}>Histórico de Turnos</Title>

      {/* Seletor de Data */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align='middle'>
          <Col>
            <span style={{ fontWeight: 'bold' }}>Selecionar Data:</span>
          </Col>
          <Col>
            <DatePicker
              value={dataSelecionada}
              onChange={handleDataChange}
              format='DD/MM/YYYY'
              placeholder='Selecione uma data'
              style={{ width: 200 }}
            />
          </Col>
          <Col>
            <Button
              type='primary'
              icon={<SearchOutlined />}
              onClick={() => buscarHistorico(dataSelecionada)}
              loading={loading.main}
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
      </Row>

      {/* Gráficos */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={7}>
          <Card title='Turnos por Tipo de Equipe'>
            {loading.grafico ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : dadosGrafico.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGrafico}
                xField='tipo'
                yField='quantidade'
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
          <Card title='Turnos Diários por Hora'>
            {loading.graficoHora ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : dadosGraficoHora.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGraficoHora}
                xField='hora'
                yField='quantidade'
                seriesField='tipo'
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
          <Card title='Turnos Diários por Base'>
            {loading.graficoBase ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size='large' />
              </div>
            ) : dadosGraficoBase.length === 0 ? (
              <Empty description='Nenhum dado disponível' />
            ) : (
              <Column
                data={dadosGraficoBase.filter(d => d.quantidade > 0)}
                xField='base'
                yField='quantidade'
                seriesField='tipo'
                isStack={true}
                height={300}
                columnWidthRatio={0.3}
                colorField='tipo'
                scale={{
                  color: {
                    range:
                      coresArray.length > 0
                        ? coresArray
                        : [
                            '#1890ff',
                            '#52c41a',
                            '#faad14',
                            '#f5222d',
                            '#722ed1',
                          ],
                  },
                }}
                label={{
                  text: (d: any) => (d.quantidade > 0 ? d.quantidade : ''),
                  position: 'inside',
                  style: {
                    fill: '#fff',
                    fontWeight: 'bold',
                    fontSize: 10,
                  },
                }}
                legend={{
                  position: 'top',
                  itemName: {
                    formatter: (text: string) => {
                      // Não mostrar na legenda tipos que não têm dados
                      const temDados = dadosGraficoBase.some(
                        d => d.tipo === text && d.quantidade > 0
                      );
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

      {/* Tabela de Histórico */}
      <Card>
        {/* Filtros */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder='Veículo'
              prefix={<SearchOutlined />}
              value={filtroVeiculo}
              onChange={e => setFiltroVeiculo(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder='Equipe'
              prefix={<SearchOutlined />}
              value={filtroEquipe}
              onChange={e => setFiltroEquipe(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Input
              placeholder='Eletricista'
              prefix={<SearchOutlined />}
              value={filtroEletricista}
              onChange={e => setFiltroEletricista(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder='Base'
              style={{ width: '100%' }}
              value={filtroBase}
              onChange={setFiltroBase}
              allowClear
              showSearch
              optionFilterProp='children'
              loading={loadingBases}
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={basesData?.map(base => ({
                label: base.nome,
                value: base.nome,
              }))}
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={turnosFiltrados}
          rowKey='id'
          pagination={pagination}
          locale={{
            emptyText: (
              <Empty
                description={
                  filtroVeiculo ||
                  filtroEquipe ||
                  filtroEletricista ||
                  filtroBase
                    ? 'Nenhum turno encontrado com os filtros aplicados'
                    : `Nenhum turno encontrado para ${dataSelecionada.format('DD/MM/YYYY')}`
                }
              />
            ),
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
        turnoInfo={
          selectedTurnoForLocation
            ? {
                id: selectedTurnoForLocation.id,
                veiculo: { placa: selectedTurnoForLocation.veiculoPlaca },
                equipe: { nome: selectedTurnoForLocation.equipeNome },
              }
            : undefined
        }
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
