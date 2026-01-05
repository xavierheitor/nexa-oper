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
} from 'antd';
import {
  FileTextOutlined,
  ReloadOutlined,
  SearchOutlined,
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
    dayjs().endOf('month'),
  ]);
  const [filtroBase, setFiltroBase] = useState<number | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<number | undefined>(
    undefined
  );

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

    return dados;
  }, [aderenciaData, filtroBase, filtroTipoEquipe]);

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

          {/* Filtros */}
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>
                Período
              </div>
              <RangePicker
                value={periodo}
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setPeriodo([dates[0], dates[1]]);
                  }
                }}
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>
                Base
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por base"
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
              <div style={{ marginBottom: 4, fontSize: '12px', fontWeight: 'bold' }}>
                Tipo de Equipe
              </div>
              <Select
                style={{ width: '100%' }}
                placeholder="Filtrar por tipo de equipe"
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
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetchAderencia()}
                loading={loadingAderencia}
                style={{ width: '100%' }}
              >
                Atualizar
              </Button>
            </Col>
          </Row>

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

