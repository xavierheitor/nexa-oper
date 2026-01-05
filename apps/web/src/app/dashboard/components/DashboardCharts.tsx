'use client';

import { Card, Col, Row, Spin, Empty } from 'antd';
import { Column } from '@ant-design/plots';
import { useMemo } from 'react';
import { useHydrated } from '@/lib/hooks/useHydrated';

interface DadosGraficoTipoEquipe {
  tipo: string;
  quantidade: number;
}

interface DadosGraficoBase {
  base: string;
  tipo: string;
  quantidade: number;
}

interface DashboardChartsProps {
  dadosGraficoTipoEquipe?: DadosGraficoTipoEquipe[] | null;
  dadosGraficoBase?: DadosGraficoBase[] | null;
  loadingTipoEquipe?: boolean;
  loadingBase?: boolean;
}

/**
 * Componente de Gráficos de Turnos do Dashboard
 *
 * Exibe 2 gráficos:
 * - Turnos do Dia por Tipo de Equipe (gráfico de colunas simples)
 * - Turnos do Dia por Base (gráfico de colunas empilhadas)
 */
export function DashboardCharts({
  dadosGraficoTipoEquipe = null,
  dadosGraficoBase = null,
  loadingTipoEquipe = false,
  loadingBase = false,
}: DashboardChartsProps) {
  // Check de hidratação
  const hydrated = useHydrated();

  // Normaliza dados para arrays (trata null/undefined)
  const dadosTipoEquipe = dadosGraficoTipoEquipe ?? [];
  const dadosBase = dadosGraficoBase ?? [];

  // Gerar array de cores na ordem dos tipos (para usar com colorField e scale)
  // IMPORTANTE: Todos os hooks devem ser chamados antes de qualquer return condicional
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

    if (dadosBase && dadosBase.length > 0) {
      const tiposUnicos = [...new Set(dadosBase.map((d: DadosGraficoBase) => d.tipo).filter(Boolean))].sort();
      return tiposUnicos.map((_, index) => coresDisponiveis[index % coresDisponiveis.length]);
    }
    return [];
  }, [dadosBase]);

  // Renderiza loading enquanto não estiver hidratado
  if (!hydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={12}>
        <Card title="Turnos do Dia por Tipo de Equipe">
          {loadingTipoEquipe ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : !dadosTipoEquipe || dadosTipoEquipe.length === 0 ? (
            <Empty description="Nenhum dado disponível" />
          ) : (
              <Column
              data={dadosTipoEquipe}
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
          {loadingBase ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin size="large" />
            </div>
          ) : !dadosBase || dadosBase.length === 0 ? (
            <Empty description="Nenhum dado disponível" />
          ) : (
              <Column
              data={dadosBase.filter(d => d.quantidade > 0)}
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
                text: (d: DadosGraficoBase) => d.quantidade > 0 ? d.quantidade : '',
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
                    const temDados = dadosBase?.some(d => d.tipo === text && d.quantidade > 0);
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
  );
}

