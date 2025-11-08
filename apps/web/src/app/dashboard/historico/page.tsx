'use client';

/**
 * Página de Histórico de Turnos
 *
 * Dashboard para visualizar histórico de turnos de uma data específica,
 * incluindo estatísticas e gráficos relacionados ao dia selecionado.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Col, Row, Statistic, Table, Tag, Spin, Empty, Typography, Space, DatePicker, Button, Tooltip } from 'antd';
import { ClockCircleOutlined, CalendarOutlined, SearchOutlined, CheckOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import ChecklistSelectorModal from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import TurnoLocationMapModal from '@/ui/components/TurnoLocationMapModal';
import { useLoadingStates } from '@/lib/hooks/useLoadingStates';
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
  const { loading, setLoading } = useLoadingStates({
    main: false,
    grafico: false,
    graficoHora: false,
    graficoBase: false,
  });
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

  // Estados para os modais de checklist
  const [checklistSelectorVisible, setChecklistSelectorVisible] = useState(false);
  const [checklistViewerVisible, setChecklistViewerVisible] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState<TurnoData | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);

  // Estados para o modal de localização
  const [locationMapVisible, setLocationMapVisible] = useState(false);
  const [selectedTurnoForLocation, setSelectedTurnoForLocation] = useState<TurnoData | null>(null);

  const buscarHistorico = useCallback(async (data: dayjs.Dayjs) => {
    setLoading('main', true);
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
        const turnosMapeados: TurnoData[] = turnos.map((turno: any) => ({
          id: turno.id,
          dataSolicitacao: turno.dataSolicitacao,
          dataInicio: turno.dataInicio,
          dataFim: turno.dataFim,
          veiculoId: turno.veiculoId,
          veiculoPlaca: turno.veiculoPlaca || 'N/A',
          veiculoModelo: turno.veiculoModelo || 'N/A',
          equipeId: turno.equipeId,
          equipeNome: turno.equipeNome || 'N/A',
          tipoEquipeNome: turno.tipoEquipeNome || 'N/A',
          baseNome: turno.baseNome || 'N/A',
          dispositivo: turno.dispositivo,
          kmInicio: turno.kmInicio,
          kmFim: turno.kmFim,
          status: turno.dataFim ? 'FECHADO' : 'ABERTO',
          eletricistas: turno.eletricistas || [],
        }));
        setTurnosHistorico(turnosMapeados);

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
      setLoading('main', false);
    }
  }, [setLoading]);

  const buscarGraficos = useCallback(async (data: dayjs.Dayjs) => {
    setLoading('grafico', true);
    setLoading('graficoHora', true);
    setLoading('graficoBase', true);

    try {
      // Calcular dados dos gráficos baseados nos turnos da data selecionada
      const inicioDia = data.startOf('day').toDate();
      const fimDia = data.endOf('day').toDate();

      // Buscar todos os tipos de equipe do banco de dados
      const resultTipos = await listTiposEquipe({
        page: 1,
        pageSize: 100,
        orderBy: 'nome',
        orderDir: 'asc',
      });

      if (!resultTipos.success || !resultTipos.data) {
        throw new Error('Erro ao buscar tipos de equipe');
      }

      const todosOsTipos = resultTipos.data.data?.map((tipo: any) => tipo.nome) || [];

      // Buscar turnos da data específica para calcular estatísticas
      const result = await listTurnos({
        page: 1,
        pageSize: 1000,
        dataInicio: inicioDia,
        dataFim: fimDia,
      });

      if (result.success && result.data) {
        const turnos = result.data.data || [];

        // Calcular estatísticas por tipo de equipe - sempre mostrar todos os tipos
        const statsPorTipo: Record<string, number> = {};

        // Inicializar todos os tipos com quantidade 0
        todosOsTipos.forEach(tipo => {
          statsPorTipo[tipo] = 0;
        });

        // Processar turnos existentes
        turnos.forEach((turno: any) => {
          const tipo = turno.tipoEquipeNome || 'Não identificado';
          if (statsPorTipo[tipo] !== undefined) {
            statsPorTipo[tipo] = (statsPorTipo[tipo] || 0) + 1;
          }
        });

        const dadosTipo = Object.entries(statsPorTipo).map(([tipo, quantidade]) => ({
          tipo,
          quantidade,
        }));
        setDadosGrafico(dadosTipo);

        // Calcular estatísticas por hora - sempre mostrar todas as 24 horas
        const statsPorHora: Record<string, Record<string, number>> = {};

        // Inicializar todas as horas de 0 a 23
        for (let i = 0; i < 24; i++) {
          statsPorHora[i] = {};
        }

        // Processar turnos existentes
        turnos.forEach((turno: any) => {
          const hora = new Date(turno.dataInicio).getHours();
          const tipo = turno.tipoEquipeNome || 'Não identificado';
          statsPorHora[hora][tipo] = (statsPorHora[hora][tipo] || 0) + 1;
        });

        // Usar todos os tipos de equipe do banco de dados
        const tiposUnicos = todosOsTipos;

        const dadosHora = Object.entries(statsPorHora).flatMap(([hora, tipos]) => {
          // Se não há turnos nesta hora, mostrar todos os tipos com quantidade 0
          if (Object.keys(tipos).length === 0) {
            return tiposUnicos.map((tipo) => ({
              hora: hora,
              tipo,
              quantidade: 0,
            }));
          }

          // Se há turnos, mostrar os tipos existentes e preencher os ausentes com 0
          return tiposUnicos.map((tipo) => ({
            hora: hora,
            tipo,
            quantidade: tipos[tipo] || 0,
          }));
        });
        setDadosGraficoHora(dadosHora);

        // Calcular estatísticas por base - sempre mostrar todas as bases
        const statsPorBase: Record<string, number> = {};

        // Primeiro, obter todas as bases únicas do banco de dados
        // Para garantir que mostramos todas as bases, mesmo as sem turnos
        const todasAsBases = [...new Set(turnos.map((turno: any) => turno.baseNome || 'Não identificada'))];

        // Inicializar todas as bases com quantidade 0
        todasAsBases.forEach(base => {
          statsPorBase[base] = 0;
        });

        // Processar turnos existentes
        turnos.forEach((turno: any) => {
          const base = turno.baseNome || 'Não identificada';
          statsPorBase[base] = (statsPorBase[base] || 0) + 1;
        });

        const dadosBase = Object.entries(statsPorBase).map(([base, quantidade]) => ({
          base,
          quantidade,
        }));
        setDadosGraficoBase(dadosBase);
      }

      setLoading('grafico', false);
      setLoading('graficoHora', false);
      setLoading('graficoBase', false);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
      setLoading('grafico', false);
      setLoading('graficoHora', false);
      setLoading('graficoBase', false);
    }
  }, [setLoading]);

  useEffect(() => {
    // Carregar dados iniciais (hoje)
    buscarHistorico(dataSelecionada);
    buscarGraficos(dataSelecionada);
  }, [dataSelecionada, buscarHistorico, buscarGraficos]);

  const handleDataChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setDataSelecionada(date);
      buscarHistorico(date);
      buscarGraficos(date);
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

  const columns: ColumnsType<TurnoData> = [

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
    {
      title: 'Ações',
      key: 'actions',
      width: 180,
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
        </Space>
      ),
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
          <Card title="Turnos por Tipo de Equipe">
            {loading.grafico ? (
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
            {loading.graficoHora ? (
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
            {loading.graficoBase ? (
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
    </div>
  );
}
