/**
 * Página de Aderência de Escala
 *
 * Mostra percentuais de aderência e não aderência agregados por base e tipo de equipe
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  DatePicker,
  Space,
  Table,
  Tag,
  Spin,
  Alert,
  Typography,
  Select,
  Row,
  Col,
  Statistic,
  Button,
  App,
  Input,
} from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { getAderenciaAgregada } from '@/lib/actions/turno/getAderenciaAgregada';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface DadosAderencia {
  baseId: number | null;
  baseNome: string;
  tipoEquipeId: number;
  tipoEquipeNome: string;
  total: number;
  aderente: number;
  naoAderente: number;
  naoAberto: number;
  turnoExtra: number;
  percentualAderencia: number;
  percentualNaoAderencia: number;
}

export default function AderenciaEscalaPage() {
  const { message } = App.useApp();
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs(), // Hoje, não o final do mês
  ]);
  const [filtroBase, setFiltroBase] = useState<number | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<number | undefined>(
    undefined
  );
  const [filtroBuscaBase, setFiltroBuscaBase] = useState<string>('');
  const [filtroBuscaTipoEquipe, setFiltroBuscaTipoEquipe] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined);

  // Buscar bases e tipos de equipe para os filtros
  const { data: basesData, loading: loadingBases } = useDataFetch<
    Array<{ id: number; nome: string }>
  >(
    async () => {
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
    },
    []
  );

  const { data: tiposEquipeData, loading: loadingTiposEquipe } =
    useDataFetch<Array<{ id: number; nome: string }>>(
      async () => {
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
      },
      []
    );

  // Buscar dados de aderência
  const {
    data: aderenciaData,
    loading: loadingAderencia,
    refetch: refetchAderencia,
  } = useDataFetch<{
    dados: DadosAderencia[];
    totais: {
      total: number;
      aderente: number;
      naoAderente: number;
      naoAberto: number;
      turnoExtra: number;
      percentualAderencia: number;
      percentualNaoAderencia: number;
    };
  }>(
    async () => {
      if (!periodo[0] || !periodo[1]) {
        throw new Error('Período inválido');
      }

      const result = await getAderenciaAgregada({
        dataInicio: periodo[0].toDate(),
        dataFim: periodo[1].toDate(),
        baseId: filtroBase,
        tipoEquipeId: filtroTipoEquipe,
      });

      if (result.success && result.data) {
        return result.data;
      }
      throw new Error(result.error || 'Erro ao carregar dados de aderência');
    },
    [periodo, filtroBase, filtroTipoEquipe]
  );

  // Filtrar dados da tabela
  const dadosFiltrados = useMemo(() => {
    if (!aderenciaData?.dados) return [];

    let dados = [...aderenciaData.dados];

    // Filtro por base já está aplicado na query, mas podemos filtrar localmente também
    if (filtroBase !== undefined) {
      dados = dados.filter((d) => d.baseId === filtroBase);
    }

    // Filtro por tipo de equipe já está aplicado na query
    if (filtroTipoEquipe !== undefined) {
      dados = dados.filter((d) => d.tipoEquipeId === filtroTipoEquipe);
    }

    // Busca textual por base
    if (filtroBuscaBase) {
      const buscaLower = filtroBuscaBase.toLowerCase();
      dados = dados.filter((d) =>
        d.baseNome?.toLowerCase().includes(buscaLower)
      );
    }

    // Busca textual por tipo de equipe
    if (filtroBuscaTipoEquipe) {
      const buscaLower = filtroBuscaTipoEquipe.toLowerCase();
      dados = dados.filter((d) =>
        d.tipoEquipeNome?.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro por status (aderência)
    if (filtroStatus) {
      if (filtroStatus === 'aderente') {
        dados = dados.filter((d) => d.percentualAderencia >= 80);
      } else if (filtroStatus === 'nao_aderente') {
        dados = dados.filter((d) => d.percentualNaoAderencia > 20);
      } else if (filtroStatus === 'critico') {
        dados = dados.filter((d) => d.percentualNaoAderencia > 50);
      }
    }

    return dados;
  }, [aderenciaData, filtroBase, filtroTipoEquipe, filtroBuscaBase, filtroBuscaTipoEquipe, filtroStatus]);

  // Colunas da tabela
  const columns: ColumnsType<DadosAderencia> = [
    {
      title: 'Base',
      dataIndex: 'baseNome',
      key: 'baseNome',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Tipo de Equipe',
      dataIndex: 'tipoEquipeNome',
      key: 'tipoEquipeNome',
      width: 200,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 100,
      align: 'center',
    },
    {
      title: 'Aderente',
      dataIndex: 'aderente',
      key: 'aderente',
      width: 120,
      align: 'center',
      render: (valor: number, record: DadosAderencia) => (
        <div>
          <div style={{ fontWeight: 'bold', color: '#52c41a' }}>{valor}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.percentualAderencia.toFixed(2)}%
          </div>
        </div>
      ),
    },
    {
      title: 'Não Aderente',
      dataIndex: 'naoAderente',
      key: 'naoAderente',
      width: 120,
      align: 'center',
      render: (valor: number) => (
        <Tag color="orange">{valor}</Tag>
      ),
    },
    {
      title: 'Não Aberto',
      dataIndex: 'naoAberto',
      key: 'naoAberto',
      width: 120,
      align: 'center',
      render: (valor: number) => (
        <Tag color="red">{valor}</Tag>
      ),
    },
    {
      title: 'Turno Extra',
      dataIndex: 'turnoExtra',
      key: 'turnoExtra',
      width: 120,
      align: 'center',
      render: (valor: number) => (
        <Tag color="blue">{valor}</Tag>
      ),
    },
    {
      title: 'Não Aderência Total',
      key: 'naoAderenciaTotal',
      width: 150,
      align: 'center',
      render: (_: any, record: DadosAderencia) => {
        const total = record.naoAderente + record.naoAberto;
        return (
          <div>
            <div style={{ fontWeight: 'bold', color: '#ff4d4f' }}>{total}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.percentualNaoAderencia.toFixed(2)}%
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={2}>
              <FileTextOutlined /> Aderência de Escala
            </Title>
            <p style={{ color: '#666', marginTop: '8px' }}>
              Visualize percentuais de aderência e não aderência agregados por
              base e tipo de equipe
            </p>
          </div>

          {/* Card de Filtros */}
          <Card
            size="small"
            title={
              <Space>
                <FilterOutlined />
                <span>Filtros</span>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Período</div>
              <RangePicker
                value={periodo}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setPeriodo([dates[0], dates[1]]);
                  }
                }}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  // Não permitir datas futuras (após hoje)
                  if (current && current > dayjs().endOf('day')) {
                    return true;
                  }
                  return false;
                }}
              />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Base</div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Todas as bases"
                  value={filtroBase}
                  onChange={(value) => setFiltroBase(value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  loading={loadingBases}
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={basesData?.map((base) => ({
                    label: base.nome,
                    value: base.id,
                  }))}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Tipo de Equipe</div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Todos os tipos"
                  value={filtroTipoEquipe}
                  onChange={(value) => setFiltroTipoEquipe(value)}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  loading={loadingTiposEquipe}
                  filterOption={(input, option) =>
                    (option?.label ?? '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={tiposEquipeData?.map((tipo) => ({
                    label: tipo.nome,
                    value: tipo.id,
                  }))}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Status</div>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Todos"
                  value={filtroStatus}
                  onChange={(value) => setFiltroStatus(value)}
                  allowClear
                  options={[
                    { label: 'Aderente (≥80%)', value: 'aderente' },
                    { label: 'Não Aderente (>20%)', value: 'nao_aderente' },
                    { label: 'Crítico (>50%)', value: 'critico' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Buscar por Base</div>
                <Input
                  placeholder="Digite o nome da base"
                  prefix={<SearchOutlined />}
                  value={filtroBuscaBase}
                  onChange={(e) => setFiltroBuscaBase(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Buscar por Tipo de Equipe</div>
                <Input
                  placeholder="Digite o tipo de equipe"
                  prefix={<SearchOutlined />}
                  value={filtroBuscaTipoEquipe}
                  onChange={(e) => setFiltroBuscaTipoEquipe(e.target.value)}
                  allowClear
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => refetchAderencia()}
                  loading={loadingAderencia}
                  style={{ width: '100%', marginTop: '24px' }}
                >
                  Atualizar
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Estatísticas Gerais */}
          {aderenciaData?.totais && (
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total de Turnos"
                    value={aderenciaData.totais.total}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Aderência"
                    value={aderenciaData.totais.percentualAderencia}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    {aderenciaData.totais.aderente} de {aderenciaData.totais.total}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Não Aderência"
                    value={aderenciaData.totais.percentualNaoAderencia}
                    suffix="%"
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                    {aderenciaData.totais.naoAderente + aderenciaData.totais.naoAberto}{' '}
                    de {aderenciaData.totais.total}
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Turnos Extras"
                    value={aderenciaData.totais.turnoExtra}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Tabela */}
          {loadingAderencia ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
            </div>
          ) : !aderenciaData ? (
            <Alert
              message="Nenhum dado encontrado"
              description="Não há dados de aderência para o período selecionado."
              type="info"
              showIcon
            />
          ) : (
            <Table
              dataSource={dadosFiltrados}
              columns={columns}
              rowKey={(record) =>
                `${record.baseId || 'null'}-${record.tipoEquipeId}`
              }
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total: ${total}`,
              }}
              scroll={{ x: 'max-content' }}
              size="small"
              bordered
            />
          )}
        </Space>
      </Card>
    </div>
  );
}

