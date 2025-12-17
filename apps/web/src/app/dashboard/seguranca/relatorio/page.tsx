'use client';

import { useState, useMemo } from 'react';
import { Card, DatePicker, Space, Typography, Spin, Select } from 'antd';
import { Column } from '@ant-design/plots';
import dayjs, { Dayjs } from 'dayjs';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { getReprovasPorPergunta } from '@/lib/actions/seguranca/getReprovasPorPergunta';
import { getReprovasPorEquipe } from '@/lib/actions/seguranca/getReprovasPorEquipe';
import { getReprovasPorTipoChecklist } from '@/lib/actions/seguranca/getReprovasPorTipoChecklist';
import { unwrapFetcher } from '@/lib/db/helpers/unrapFetcher';
import { listBases } from '@/lib/actions/base/list';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface ReprovaPorPergunta {
  perguntaId: number;
  perguntaNome: string;
  quantidade: number;
}

interface ReprovaPorEquipe {
  equipeId: number;
  equipeNome: string;
  quantidade: number;
}

interface ReprovaPorTipoChecklist {
  tipoChecklistId: number;
  tipoChecklistNome: string;
  quantidade: number;
}

export default function RelatorioSegurancaPage() {
  // Estado para o período (padrão: mês atual)
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  // Estado para a base selecionada
  const [baseId, setBaseId] = useState<number | undefined>(undefined);

  // Buscar lista de bases
  const { data: basesData } = useDataFetch(
    () => unwrapFetcher(listBases)({ page: 1, pageSize: 1000, orderBy: 'nome', orderDir: 'asc' }),
    []
  );

  const bases = basesData || [];

  // Buscar dados de reprovas por pergunta
  const { data, loading, refetch } = useDataFetch<ReprovaPorPergunta[]>(
    () =>
      unwrapFetcher(getReprovasPorPergunta)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
      }),
    [periodo, baseId]
  );

  // Buscar dados de reprovas por equipe
  const {
    data: dataEquipes,
    loading: loadingEquipes,
  } = useDataFetch<ReprovaPorEquipe[]>(
    () =>
      unwrapFetcher(getReprovasPorEquipe)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
      }),
    [periodo, baseId]
  );

  // Buscar dados de reprovas por tipo de checklist
  const {
    data: dataTiposChecklist,
    loading: loadingTiposChecklist,
  } = useDataFetch<ReprovaPorTipoChecklist[]>(
    () =>
      unwrapFetcher(getReprovasPorTipoChecklist)({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        ...(baseId && { baseId }),
      }),
    [periodo, baseId]
  );

  // Configuração do gráfico de perguntas
  const chartConfigPerguntas = useMemo(() => {
    if (!data || data.length === 0) {
      return null;
    }

    // Limitar a top 10 perguntas com mais reprovas
    const top10 = data.slice(0, 10);

    return {
      data: top10.map(item => ({
        pergunta: item.perguntaNome.length > 50
          ? `${item.perguntaNome.substring(0, 50)}...`
          : item.perguntaNome,
        quantidade: item.quantidade,
        perguntaCompleta: item.perguntaNome,
      })),
      xField: 'pergunta',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: any) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
        customContent: (title: string, items: any[]) => {
          if (!items || items.length === 0) return '';
          const item = items[0];
          const dataItem = top10.find(d =>
            (d.perguntaNome.length > 50
              ? `${d.perguntaNome.substring(0, 50)}...`
              : d.perguntaNome) === item.name
          );
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">${dataItem?.perguntaNome || title}</div>
              <div>Reprovas: <strong>${item.value}</strong></div>
            </div>
          `;
        },
      },
      color: '#ff4d4f',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [data]);

  // Configuração do gráfico de equipes
  const chartConfigEquipes = useMemo(() => {
    if (!dataEquipes || dataEquipes.length === 0) {
      return null;
    }

    // Limitar a top 10 equipes com mais reprovas
    const top10 = dataEquipes.slice(0, 10);

    return {
      data: top10.map(item => ({
        equipe: item.equipeNome,
        quantidade: item.quantidade,
      })),
      xField: 'equipe',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: any) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
      },
      color: '#1890ff',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [dataEquipes]);

  // Configuração do gráfico de tipos de checklist
  const chartConfigTiposChecklist = useMemo(() => {
    if (!dataTiposChecklist || dataTiposChecklist.length === 0) {
      return null;
    }

    // Mostrar todos os tipos de checklist (geralmente são poucos)
    return {
      data: dataTiposChecklist.map(item => ({
        tipoChecklist: item.tipoChecklistNome,
        quantidade: item.quantidade,
      })),
      xField: 'tipoChecklist',
      yField: 'quantidade',
      label: {
        position: 'top' as const,
        style: {
          fill: '#000',
        },
      },
      tooltip: {
        formatter: (datum: any) => {
          return {
            name: 'Reprovas',
            value: `${datum.quantidade}`,
          };
        },
      },
      color: '#52c41a',
      columnStyle: {
        radius: [4, 4, 0, 0],
      },
    };
  }, [dataTiposChecklist]);

  const handlePeriodoChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setPeriodo([dates[0], dates[1]]);
      // O refetch será automático quando periodo mudar (via deps do useDataFetch)
    }
  };

  return (
    <Card
      title="Relatório de Segurança"
      extra={
        <Space>
          <Select
            placeholder="Todas as bases"
            allowClear
            style={{ width: 200 }}
            value={baseId}
            onChange={setBaseId}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={bases.map((base: any) => ({
              value: base.id,
              label: base.nome,
            }))}
          />
          <RangePicker
            value={periodo}
            onChange={handlePeriodoChange}
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </Space>
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Top 10 Perguntas com Mais Reprovas</Title>
          <Typography.Text type="secondary">
            Período: {periodo[0].format('DD/MM/YYYY')} a {periodo[1].format('DD/MM/YYYY')}
          </Typography.Text>
        </div>

        {loading || loadingEquipes || loadingTiposChecklist ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (!data || data.length === 0) &&
          (!dataEquipes || dataEquipes.length === 0) &&
          (!dataTiposChecklist || dataTiposChecklist.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Typography.Text type="secondary">
              Nenhuma reprova encontrada no período selecionado.
            </Typography.Text>
          </div>
        ) : (
          <>
            {/* Gráfico de Perguntas */}
            <div>
              <Title level={4}>Top 10 Perguntas com Mais Reprovas</Title>
              {chartConfigPerguntas ? (
                <div style={{ height: '500px' }}>
                  <Column {...chartConfigPerguntas} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Typography.Text type="secondary">
                    Nenhuma reprova encontrada para perguntas.
                  </Typography.Text>
                </div>
              )}
            </div>

            {/* Gráfico de Equipes */}
            <div style={{ marginTop: '40px' }}>
              <Title level={4}>Top 10 Equipes com Mais Reprovas</Title>
              {chartConfigEquipes ? (
                <div style={{ height: '500px' }}>
                  <Column {...chartConfigEquipes} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Typography.Text type="secondary">
                    Nenhuma reprova encontrada para equipes.
                  </Typography.Text>
                </div>
              )}
            </div>

            {/* Gráfico de Tipos de Checklist */}
            <div style={{ marginTop: '40px' }}>
              <Title level={4}>Reprovas por Tipo de Checklist</Title>
              {chartConfigTiposChecklist ? (
                <div style={{ height: '500px' }}>
                  <Column {...chartConfigTiposChecklist} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Typography.Text type="secondary">
                    Nenhuma reprova encontrada para tipos de checklist.
                  </Typography.Text>
                </div>
              )}
            </div>
          </>
        )}

        {(data && data.length > 0) ||
        (dataEquipes && dataEquipes.length > 0) ||
        (dataTiposChecklist && dataTiposChecklist.length > 0) ? (
          <Card size="small" title="Resumo">
            <Space direction="vertical">
              {data && data.length > 0 && (
                <>
                  <Typography.Text>
                    <strong>Total de reprovas (perguntas):</strong>{' '}
                    {data.reduce((acc, item) => acc + item.quantidade, 0)}
                  </Typography.Text>
                  <Typography.Text>
                    <strong>Perguntas com reprovas:</strong> {data.length}
                  </Typography.Text>
                  {data.length > 10 && (
                    <Typography.Text type="secondary">
                      Mostrando apenas as top 10 perguntas. Existem mais {data.length - 10}{' '}
                      perguntas com reprovas.
                    </Typography.Text>
                  )}
                </>
              )}
              {dataEquipes && dataEquipes.length > 0 && (
                <>
                  <Typography.Text>
                    <strong>Total de reprovas (equipes):</strong>{' '}
                    {dataEquipes.reduce((acc, item) => acc + item.quantidade, 0)}
                  </Typography.Text>
                  <Typography.Text>
                    <strong>Equipes com reprovas:</strong> {dataEquipes.length}
                  </Typography.Text>
                  {dataEquipes.length > 10 && (
                    <Typography.Text type="secondary">
                      Mostrando apenas as top 10 equipes. Existem mais{' '}
                      {dataEquipes.length - 10} equipes com reprovas.
                    </Typography.Text>
                  )}
                </>
              )}
              {dataTiposChecklist && dataTiposChecklist.length > 0 && (
                <>
                  <Typography.Text>
                    <strong>Total de reprovas (tipos de checklist):</strong>{' '}
                    {dataTiposChecklist.reduce((acc, item) => acc + item.quantidade, 0)}
                  </Typography.Text>
                  <Typography.Text>
                    <strong>Tipos de checklist com reprovas:</strong>{' '}
                    {dataTiposChecklist.length}
                  </Typography.Text>
                </>
              )}
            </Space>
          </Card>
        ) : null}
      </Space>
    </Card>
  );
}
