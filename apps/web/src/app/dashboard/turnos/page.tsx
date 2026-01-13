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
import { Typography, Spin } from 'antd';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByHoraETipoEquipe } from '@/lib/actions/turno/getStatsByHoraETipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { getTurnosPrevistosHoje } from '@/lib/actions/turno/getTurnosPrevistos';
import { getEstatisticasTurnosPrevistos } from '@/lib/actions/turno/getEstatisticasTurnosPrevistos';
import type {
  TurnoPrevisto,
  EstatisticasTurnosPrevistos,
} from '@/lib/types/turnoPrevisto';
import ChecklistSelectorModal from '@/ui/components/ChecklistSelectorModal';
import ChecklistViewerModal from '@/ui/components/ChecklistViewerModal';
import TurnoLocationMapModal from '@/ui/components/TurnoLocationMapModal';
import FecharTurnoModal from '@/ui/components/FecharTurnoModal';
import type { ChecklistPreenchido } from '@/ui/components/ChecklistSelectorModal';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import type { TurnoData } from '@/lib/types/turno-frontend';

import {
  DadosGraficoTipoEquipe,
  DadosGraficoHora,
  DadosGraficoBase,
} from './types';
import { TurnosFilters } from './components/TurnosFilters';
import { TurnosKPIs } from './components/TurnosKPIs';
import { TurnosCharts } from './components/TurnosCharts';
import { TurnosAbertosTable } from './components/TurnosAbertosTable';
import { TurnosPrevistosStats } from './components/TurnosPrevistosStats';
import { TurnosNaoAbertosTable } from './components/TurnosNaoAbertosTable';
import { TurnosPrevistosTable } from './components/TurnosPrevistosTable';

const { Title } = Typography;

export default function TurnosPage() {
  // Estados para os filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('');
  const [filtroEletricista, setFiltroEletricista] = useState<string>('');
  const [filtroBase, setFiltroBase] = useState<string | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<string | undefined>(
    undefined
  );

  // Filtros específicos para turnos previstos
  const [filtroBaseTurnosPrevistos, setFiltroBaseTurnosPrevistos] = useState<
    string | undefined
  >(undefined);
  const [filtroTipoEquipeTurnosPrevistos, setFiltroTipoEquipeTurnosPrevistos] =
    useState<string | undefined>(undefined);

  // Filtros para detalhamento de turnos previstos
  const [filtroBaseDetalhamento, setFiltroBaseDetalhamento] = useState<
    string | undefined
  >(undefined);
  const [filtroTipoEquipeDetalhamento, setFiltroTipoEquipeDetalhamento] =
    useState<string | undefined>(undefined);
  const [filtroStatusDetalhamento, setFiltroStatusDetalhamento] = useState<
    string | undefined
  >(undefined);

  // Hook para paginação client-side da tabela principal
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
    showTotal: total =>
      `Total de ${total} turno${total !== 1 ? 's' : ''}${filtroVeiculo || filtroEquipe || filtroEletricista || filtroBase || filtroTipoEquipe ? ' (filtrado)' : ''}`,
  });

  // Hook para paginação da tabela de turnos não abertos
  const { pagination: paginationNaoAbertos } = useTablePagination({
    defaultPageSize: 10,
    showTotal: total =>
      `Total de ${total} turno${total !== 1 ? 's' : ''} não aberto${total !== 1 ? 's' : ''}`,
  });

  // Hook para paginação da tabela detalhada de turnos previstos
  const { pagination: paginationTurnosPrevistos } = useTablePagination({
    defaultPageSize: 20,
    showTotal: total =>
      `Total de ${total} turno${total !== 1 ? 's' : ''} previsto${total !== 1 ? 's' : ''}`,
  });

  // Hook para paginação da tabela de turnos previstos futuros
  const { pagination: paginationTurnosFuturos } = useTablePagination({
    defaultPageSize: 10,
    showTotal: total =>
      `Total de ${total} turno${total !== 1 ? 's' : ''} previsto${total !== 1 ? 's' : ''} para o resto do dia`,
  });

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

  // Fetch de turnos abertos e totais do dia (usando nova server action otimizada)
  const {
    data: turnosAbertosResult,
    loading: loadingTurnos,
    error: errorTurnos,
    refetch: refetchTurnos,
  } = useDataFetch<{
    turnosAbertos: TurnoData[];
    totalDiarios: number;
    stats: {
      total: number;
      totalDiarios: number;
      porBase: Record<string, number>;
    };
  }>(async () => {
    const { getTurnosAbertosComStats } = await import(
      '@/lib/actions/turno/getTurnosAbertosComStats'
    );

    const result = await getTurnosAbertosComStats({
      filtroVeiculo: filtroVeiculo || undefined,
      filtroEquipe: filtroEquipe || undefined,
      filtroEletricista: filtroEletricista || undefined,
      filtroBase: filtroBase || undefined,
      filtroTipoEquipe: filtroTipoEquipe || undefined,
    });

    if (result.success && result.data) {
      return result.data;
    }

    throw new Error(result.error || 'Erro ao carregar turnos');
  }, [
    filtroVeiculo,
    filtroEquipe,
    filtroEletricista,
    filtroBase,
    filtroTipoEquipe,
  ]);

  // Processar dados dos turnos (já vêm filtrados do servidor!)
  const { turnosFiltrados, stats } = useMemo(() => {
    const turnos = turnosAbertosResult?.turnosAbertos || [];
    const statsFromServer = turnosAbertosResult?.stats;

    return {
      turnosFiltrados: turnos,
      stats: statsFromServer || {
        total: 0,
        totalDiarios: 0,
        porBase: {},
      },
    };
  }, [turnosAbertosResult]);

  // Fetch de gráfico por tipo de equipe
  const {
    data: dadosGrafico,
    loading: loadingGrafico,
    error: errorGrafico,
    refetch: refetchGrafico,
  } = useDataFetch<DadosGraficoTipoEquipe[]>(async () => {
    const result = await getStatsByTipoEquipe();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao carregar dados do gráfico');
  }, []);

  // Fetch de gráfico por hora e tipo
  const {
    data: dadosGraficoHora,
    loading: loadingGraficoHora,
    error: errorGraficoHora,
    refetch: refetchGraficoHora,
  } = useDataFetch<DadosGraficoHora[]>(async () => {
    const result = await getStatsByHoraETipoEquipe();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(
      result.error || 'Erro ao carregar dados do gráfico por hora'
    );
  }, []);

  // Fetch de gráfico por base
  const {
    data: dadosGraficoBase,
    loading: loadingGraficoBase,
    error: errorGraficoBase,
    refetch: refetchGraficoBase,
  } = useDataFetch<DadosGraficoBase[]>(async () => {
    const result = await getStatsByBase();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(
      result.error || 'Erro ao carregar dados do gráfico por base'
    );
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

    const todosOsTipos = new Set<string>();

    if (dadosGraficoBase && dadosGraficoBase.length > 0) {
      dadosGraficoBase.forEach(d => d.tipo && todosOsTipos.add(d.tipo));
    }
    if (dadosGraficoHora && dadosGraficoHora.length > 0) {
      dadosGraficoHora.forEach(d => d.tipo && todosOsTipos.add(d.tipo));
    }
    if (dadosGrafico && dadosGrafico.length > 0) {
      dadosGrafico.forEach(d => d.tipo && todosOsTipos.add(d.tipo));
    }

    const tiposUnicos = Array.from(todosOsTipos).sort();
    return tiposUnicos.map(
      (_, index) => coresDisponiveis[index % coresDisponiveis.length]
    );
  }, [dadosGraficoBase, dadosGraficoHora, dadosGrafico]);

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

  // Fetch de tipos de equipe para o select
  const { data: tiposEquipeData, loading: loadingTiposEquipe } = useDataFetch<
    Array<{ id: number; nome: string }>
  >(async () => {
    const result = await listTiposEquipe({
      page: 1,
      pageSize: 1000,
      orderBy: 'nome',
      orderDir: 'asc',
    });
    if (result.success && result.data) {
      return result.data.data || [];
    }
    throw new Error(result.error || 'Erro ao carregar tipos de equipe');
  }, []);

  // Fetch de turnos previstos
  const {
    data: turnosPrevistosResult,
    loading: loadingTurnosPrevistos,
    refetch: refetchTurnosPrevistos,
  } = useDataFetch<TurnoPrevisto[]>(async () => {
    const result = await getTurnosPrevistosHoje();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao carregar turnos previstos');
  }, []);

  // Dados filtrados para o detalhamento de turnos previstos
  const turnosPrevistosFiltrados = useMemo(() => {
    if (!turnosPrevistosResult) return [];

    let filtrados = [...turnosPrevistosResult];

    if (filtroBaseDetalhamento) {
      filtrados = filtrados.filter(tp => {
        return tp.baseNome === filtroBaseDetalhamento;
      });
    }

    if (filtroTipoEquipeDetalhamento) {
      filtrados = filtrados.filter(tp => {
        return tp.tipoEquipeNome === filtroTipoEquipeDetalhamento;
      });
    }

    if (filtroStatusDetalhamento) {
      filtrados = filtrados.filter(tp => {
        return tp.status === filtroStatusDetalhamento;
      });
    }

    return filtrados;
  }, [
    turnosPrevistosResult,
    filtroBaseDetalhamento,
    filtroTipoEquipeDetalhamento,
    filtroStatusDetalhamento,
  ]);

  // Fetch de estatísticas de turnos previstos
  const {
    data: statsPrevistosResult,
    loading: loadingStatsPrevistos,
    refetch: refetchStatsPrevistos,
  } = useDataFetch<EstatisticasTurnosPrevistos>(async () => {
    const result = await getEstatisticasTurnosPrevistos();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(
      result.error || 'Erro ao carregar estatísticas de turnos previstos'
    );
  }, []);

  // Loading geral (qualquer um dos fetches)
  const loading =
    loadingTurnos || loadingGrafico || loadingGraficoHora || loadingGraficoBase;

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

  // Check de hidratação DEPOIS de todos os hooks
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

  if (loading && !turnosAbertosResult?.turnosAbertos?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size='large' />
      </div>
    );
  }

  // Lógica para divisão de turnos não abertos e futuros
  let turnosNaoAbertosAtrasados: TurnoPrevisto[] = [];
  let turnosPrevistosFuturos: TurnoPrevisto[] = [];

  if (turnosPrevistosResult) {
    const agora = new Date();
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();

    const horarioParaMinutos = (
      horario: string | null | undefined
    ): number | null => {
      if (!horario || typeof horario !== 'string') return null;
      const [hora, minuto] = horario.split(':').map(Number);
      if (isNaN(hora) || isNaN(minuto)) return null;
      return hora * 60 + minuto;
    };

    turnosNaoAbertosAtrasados = turnosPrevistosResult.filter(tp => {
      if (tp.status !== 'NAO_ABERTO') return false;
      if (!tp.horarioPrevisto) return true;
      const minutosPrevistos = horarioParaMinutos(tp.horarioPrevisto);
      if (minutosPrevistos === null) return true;
      return minutosPrevistos <= horaAtual;
    });

    if (filtroBaseTurnosPrevistos) {
      turnosNaoAbertosAtrasados = turnosNaoAbertosAtrasados.filter(tp => {
        return tp.baseNome === filtroBaseTurnosPrevistos;
      });
    }
    if (filtroTipoEquipeTurnosPrevistos) {
      turnosNaoAbertosAtrasados = turnosNaoAbertosAtrasados.filter(tp => {
        return tp.tipoEquipeNome === filtroTipoEquipeTurnosPrevistos;
      });
    }

    turnosPrevistosFuturos = turnosPrevistosResult.filter(tp => {
      if (tp.status !== 'NAO_ABERTO') return false;
      if (!tp.horarioPrevisto) return false;
      const minutosPrevistos = horarioParaMinutos(tp.horarioPrevisto);
      if (minutosPrevistos === null) return false;
      return minutosPrevistos > horaAtual;
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Turnos Abertos - Hoje ({dataFormatada})</Title>

      <ErrorAlert error={errorTurnos} onRetry={refetchTurnos} />
      <ErrorAlert error={errorGrafico} onRetry={refetchGrafico} />
      <ErrorAlert error={errorGraficoHora} onRetry={refetchGraficoHora} />
      <ErrorAlert error={errorGraficoBase} onRetry={refetchGraficoBase} />

      <TurnosKPIs stats={stats} />

      <TurnosCharts
        dadosGrafico={dadosGrafico || undefined}
        loadingGrafico={loadingGrafico}
        dadosGraficoHora={dadosGraficoHora || undefined}
        loadingGraficoHora={loadingGraficoHora}
        dadosGraficoBase={dadosGraficoBase || undefined}
        loadingGraficoBase={loadingGraficoBase}
        coresArray={coresArray}
      />

      <div style={{ marginBottom: 24 }}>
        <TurnosFilters
          filtroVeiculo={filtroVeiculo}
          setFiltroVeiculo={setFiltroVeiculo}
          filtroEquipe={filtroEquipe}
          setFiltroEquipe={setFiltroEquipe}
          filtroEletricista={filtroEletricista}
          setFiltroEletricista={setFiltroEletricista}
          filtroBase={filtroBase}
          setFiltroBase={setFiltroBase}
          filtroTipoEquipe={filtroTipoEquipe}
          setFiltroTipoEquipe={setFiltroTipoEquipe}
          basesData={basesData || undefined}
          loadingBases={loadingBases}
          tiposEquipeData={tiposEquipeData || undefined}
          loadingTiposEquipe={loadingTiposEquipe}
        />

        <TurnosAbertosTable
          turnosFiltrados={turnosFiltrados}
          pagination={pagination}
          handleViewChecklists={handleViewChecklists}
          handleViewLocation={handleViewLocation}
          handleFecharTurno={handleFecharTurno}
        />
      </div>

      {loadingStatsPrevistos ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size='large' />
        </div>
      ) : (
        <>
          {statsPrevistosResult && (
            <TurnosPrevistosStats stats={statsPrevistosResult} />
          )}

          {loadingTurnosPrevistos ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size='large' />
            </div>
          ) : (
            turnosPrevistosResult && (
              <>
                <TurnosNaoAbertosTable
                  title={
                    <span>
                      Turnos Previstos Não Abertos (Atrasados) (
                      <span style={{ color: 'red' }}>
                        {turnosNaoAbertosAtrasados.length}
                      </span>
                      )
                    </span>
                  }
                  dataSource={turnosNaoAbertosAtrasados}
                  pagination={paginationNaoAbertos}
                  filtroBase={filtroBaseTurnosPrevistos}
                  setFiltroBase={setFiltroBaseTurnosPrevistos}
                  filtroTipoEquipe={filtroTipoEquipeTurnosPrevistos}
                  setFiltroTipoEquipe={setFiltroTipoEquipeTurnosPrevistos}
                  basesData={basesData || undefined}
                  tiposEquipeData={tiposEquipeData || undefined}
                  showFilters={true}
                  extraTag={
                    <span
                      style={{
                        color: 'red',
                        border: '1px solid red',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Deveriam ter sido abertos até agora
                    </span>
                  }
                />

                {turnosPrevistosFuturos.length > 0 && (
                  <TurnosNaoAbertosTable
                    title={
                      <span>
                        Turnos Previstos para o Resto do Dia (
                        <span style={{ color: '#1890ff' }}>
                          {turnosPrevistosFuturos.length}
                        </span>
                        )
                      </span>
                    }
                    dataSource={turnosPrevistosFuturos}
                    pagination={paginationTurnosFuturos}
                    extraTag={
                      <span
                        style={{
                          color: '#1890ff',
                          border: '1px solid #1890ff',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        Ainda não passou do horário previsto
                      </span>
                    }
                  />
                )}

                <TurnosPrevistosTable
                  turnosPrevistosFiltrados={turnosPrevistosFiltrados}
                  pagination={paginationTurnosPrevistos}
                  filtroBase={filtroBaseDetalhamento}
                  setFiltroBase={setFiltroBaseDetalhamento}
                  filtroTipoEquipe={filtroTipoEquipeDetalhamento}
                  setFiltroTipoEquipe={setFiltroTipoEquipeDetalhamento}
                  basesData={basesData || undefined}
                  tiposEquipeData={tiposEquipeData || undefined}
                  filtroStatus={filtroStatusDetalhamento}
                  setFiltroStatus={setFiltroStatusDetalhamento}
                />
              </>
            )
          )}
        </>
      )}

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

      <FecharTurnoModal
        visible={fecharTurnoVisible}
        onClose={handleCloseFecharTurno}
        turno={selectedTurnoParaFechar}
        onSuccess={handleFecharTurnoSuccess}
      />
    </div>
  );
}
