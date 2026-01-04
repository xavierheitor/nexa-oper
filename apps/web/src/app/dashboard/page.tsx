'use client';

/**
 * Página Principal do Dashboard
 *
 * Dashboard com informações consolidadas sobre:
 * - Turnos abertos no momento
 * - Turnos do dia
 * - Turnos por tipo de equipe e base
 * - Estatísticas de recursos por base (eletricistas, veículos, equipes)
 */

import React, { useMemo } from 'react';
import { Card, Col, Row, Statistic, Spin, Empty, Typography } from 'antd';
import { useHydrated } from '@/lib/hooks/useHydrated';
import { ErrorAlert } from '@/ui/components/ErrorAlert';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  CarOutlined,
  ApartmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { listTurnos } from '@/lib/actions/turno/list';
import { Column } from '@ant-design/plots';
import { getStatsByTipoEquipe } from '@/lib/actions/turno/getStatsByTipoEquipe';
import { getStatsByBase } from '@/lib/actions/turno/getStatsByBase';
import { getRecursosPorBase, type RecursosPorBase } from '@/lib/actions/turno/getRecursosPorBase';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { getTodayDateRange } from '@/lib/utils/dateHelpers';

const { Title } = Typography;

interface DadosGraficoTipoEquipe {
  tipo: string;
  quantidade: number;
}

interface DadosGraficoBase {
  base: string;
  tipo: string;
  quantidade: number;
}

export default function DashboardPage() {
  // Fetch de turnos abertos e totais do dia
  const { data: turnosData, loading: loadingTurnos, error: errorTurnos, refetch: refetchTurnos } = useDataFetch<{
    turnosAbertos: number;
    totalDiarios: number;
  }>(
    async () => {
      // Usa a função helper que já trata o timezone corretamente
      const { inicio, fim } = getTodayDateRange();
      // Ajusta o fim para incluir até o último milissegundo do dia
      const fimAjustado = new Date(fim);
      fimAjustado.setMilliseconds(999);

      const [resultAbertos, resultTodos] = await Promise.all([
        listTurnos({ page: 1, pageSize: 1000, status: 'ABERTO' }),
        // Buscar todos os turnos do dia (abertos e fechados) sem filtro de status
        listTurnos({ page: 1, pageSize: 1000, dataInicio: inicio, dataFim: fimAjustado }),
      ]);

      // Tratar resultado de turnos abertos
      const turnosAbertos = resultAbertos.success && resultAbertos.data
        ? (resultAbertos.data.total ?? resultAbertos.data.data?.length ?? 0)
        : 0;

      // Tratar resultado de turnos do dia (todos - abertos e fechados)
      // Usa total da paginação se disponível, senão conta o array
      const totalDiarios = resultTodos.success && resultTodos.data
        ? (resultTodos.data.total ?? resultTodos.data.data?.length ?? 0)
        : 0;

      // Debug temporário - remover depois
      if (process.env.NODE_ENV === 'development') {
        console.log('[Dashboard] Turnos do dia:', {
          inicio: inicio.toISOString(),
          fimAjustado: fimAjustado.toISOString(),
          totalDiarios,
          turnosAbertos,
          resultTodosSuccess: resultTodos.success,
          resultTodosTotal: resultTodos.data?.total,
          resultTodosDataLength: resultTodos.data?.data?.length,
        });
      }

      return {
        turnosAbertos,
        totalDiarios,
      };
    },
    []
  );

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

  // Fetch de recursos por base
  const { data: recursosPorBase, loading: loadingRecursos, error: errorRecursos, refetch: refetchRecursos } = useDataFetch<RecursosPorBase[]>(
    async () => {
      const result = await getRecursosPorBase();
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar recursos por base');
    },
    []
  );

  // Loading geral
  const loading = loadingTurnos || loadingGrafico || loadingGraficoBase || loadingRecursos;

  // Formatar data de referência (hoje) para exibição no título
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Check de hidratação DEPOIS de todos os hooks
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Dashboard - {dataFormatada}</Title>

      {/* Tratamento de Erros */}
      <ErrorAlert error={errorTurnos} onRetry={refetchTurnos} />
      <ErrorAlert error={errorGrafico} onRetry={refetchGrafico} />
      <ErrorAlert error={errorGraficoBase} onRetry={refetchGraficoBase} />
      <ErrorAlert error={errorRecursos} onRetry={refetchRecursos} />

      {/* Estatísticas Principais */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Turnos Abertos no Momento"
              value={turnosData?.turnosAbertos ?? 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Turnos do Dia"
              value={turnosData?.totalDiarios ?? 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Eletricistas"
              value={
                recursosPorBase?.reduce((acc, r) => acc + r.eletricistas, 0) || 0
              }
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total de Veículos"
              value={recursosPorBase?.reduce((acc, r) => acc + r.veiculos, 0) || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos de Turnos */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Turnos do Dia por Tipo de Equipe">
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
        <Col xs={24} md={12}>
          <Card title="Turnos do Dia por Base">
            {loadingGraficoBase ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : !dadosGraficoBase || dadosGraficoBase.length === 0 ? (
              <Empty description="Nenhum dado disponível" />
            ) : (
              <Column
                data={dadosGraficoBase.filter(d => d.quantidade > 0)}
                xField="base"
                yField="quantidade"
                seriesField="tipo"
                isStack={true}
                height={300}
                columnWidthRatio={0.3}
                colorField="tipo"
                scale={{
                  color: {
                    range: coresArray.length > 0 ? coresArray : ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'],
                  },
                }}
                label={{
                  text: (d: any) => d.quantidade > 0 ? d.quantidade : '',
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
                    formatter: (text: string, item: any) => {
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

      {/* Estatísticas de Recursos por Base */}
      <Row gutter={[16, 16]}>
        {loadingRecursos ? (
          <Col xs={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            </Card>
          </Col>
        ) : !recursosPorBase || recursosPorBase.length === 0 ? (
          <Col xs={24}>
            <Card>
              <Empty description="Nenhum dado disponível" />
            </Card>
          </Col>
        ) : (
          recursosPorBase.map((recurso) => (
            <Col xs={24} sm={12} md={8} lg={6} key={recurso.base}>
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <ApartmentOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }} />
                  <Title level={5} style={{ margin: 0 }}>
                    {recurso.base}
                  </Title>
                </div>
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <Statistic
                      title="Eletricistas"
                      value={recurso.eletricistas}
                      prefix={<UserOutlined />}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col xs={24}>
                    <Statistic
                      title="Veículos"
                      value={recurso.veiculos}
                      prefix={<CarOutlined />}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                  <Col xs={24}>
                    <Statistic
                      title="Equipes"
                      value={recurso.equipes}
                      prefix={<TeamOutlined />}
                      valueStyle={{ fontSize: 18 }}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
}
