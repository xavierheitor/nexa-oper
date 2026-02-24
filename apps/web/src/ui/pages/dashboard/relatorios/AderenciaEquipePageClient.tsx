'use client';

import { useState, useMemo } from 'react';
import { Card, Form, Select, DatePicker, Button, Table, Statistic, Row, Col, Space, Input } from 'antd';
import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { getAderenciaEquipe } from '@/lib/actions/turno-realizado/getAderenciaEquipe';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listBases } from '@/lib/actions/base/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { useSelectOptions } from '@/lib/hooks/useSelectOptions';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Página de relatório de aderência de equipes
 */
export default function AderenciaEquipePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);

  // Estados dos filtros da tabela
  const [filtroBuscaEquipe, setFiltroBuscaEquipe] = useState<string>('');
  const [filtroBuscaEletricista, setFiltroBuscaEletricista] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(undefined);
  const [filtroBase, setFiltroBase] = useState<number | undefined>(undefined);
  const [filtroTipoEquipe, setFiltroTipoEquipe] = useState<number | undefined>(undefined);

  // Carregar dados para os filtros
  const { data: equipes } = useDataFetch(
    async () => {
      const result = await listEquipes({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    []
  );

  const { data: bases } = useDataFetch(
    async () => {
      const result = await listBases({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    []
  );

  const { data: tiposEquipe } = useDataFetch(
    async () => {
      const result = await listTiposEquipe({
        page: 1,
        pageSize: 1000,
        orderBy: 'nome',
        orderDir: 'asc',
      });
      return result.success && result.data ? result.data.data : [];
    },
    []
  );

  const basesOptions = useSelectOptions(bases, { labelKey: 'nome', valueKey: 'id' });
  const tiposEquipeOptions = useSelectOptions(tiposEquipe, { labelKey: 'nome', valueKey: 'id' });

  // Filtrar equipes baseado nos filtros
  const equipesFiltradas = useMemo(() => {
    if (!equipes) return [];
    let filtradas = [...equipes];

    if (filtroBase) {
      filtradas = filtradas.filter((eq: any) => {
        // Verificar se a equipe tem a base atual
        return eq.baseAtual?.id === filtroBase;
      });
    }

    if (filtroTipoEquipe) {
      filtradas = filtradas.filter((eq: any) => eq.tipoEquipeId === filtroTipoEquipe);
    }

    if (filtroBuscaEquipe) {
      const buscaLower = filtroBuscaEquipe.toLowerCase();
      filtradas = filtradas.filter((eq: any) =>
        eq.nome?.toLowerCase().includes(buscaLower)
      );
    }

    return filtradas;
  }, [equipes, filtroBase, filtroTipoEquipe, filtroBuscaEquipe]);

  const equipesOptions = useSelectOptions(equipesFiltradas, { labelKey: 'nome', valueKey: 'id' });

  // Filtrar detalhamento da tabela
  const detalhamentoFiltrado = useMemo(() => {
    if (!dados?.detalhamento) return [];

    let filtrado = [...dados.detalhamento];

    // Filtro por busca de eletricista (nome ou matrícula)
    // Nota: Este filtro seria aplicado se tivéssemos dados de eletricistas no detalhamento
    // Por enquanto, o detalhamento só tem contagens, não nomes individuais

    // Filtro por status
    if (filtroStatus) {
      if (filtroStatus === 'aberto') {
        filtrado = filtrado.filter((d: any) => d.turnoAberto);
      } else if (filtroStatus === 'fechado') {
        filtrado = filtrado.filter((d: any) => !d.turnoAberto);
      } else if (filtroStatus === 'aderente') {
        filtrado = filtrado.filter((d: any) => d.aderencia >= 80);
      } else if (filtroStatus === 'nao_aderente') {
        filtrado = filtrado.filter((d: any) => d.aderencia < 80);
      }
    }

    return filtrado;
  }, [dados, filtroStatus]);

  // Hook para paginação client-side
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
    showTotal: (total) => `Total de ${total} dia${total !== 1 ? 's' : ''}${filtroStatus || filtroBuscaEletricista ? ' (filtrado)' : ''}`,
  });

  const handleBuscar = async (values: any) => {
    setLoading(true);
    try {
      const [dataInicio, dataFim] = values.periodo;
      const result = await getAderenciaEquipe({
        equipeId: values.equipeId,
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      });

      if (result.success) {
        setDados(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'data',
      key: 'data',
      render: (date: string | Date) => {
        const dataObj = date instanceof Date ? date : new Date(date);
        return dayjs(dataObj).format('DD/MM/YYYY');
      },
    },
    {
      title: 'Escalados',
      dataIndex: 'eletricistasEscalados',
      key: 'escalados',
    },
    {
      title: 'Trabalharam',
      dataIndex: 'eletricistasQueTrabalharam',
      key: 'trabalharam',
    },
    {
      title: 'Turno Aberto',
      dataIndex: 'turnoAberto',
      key: 'turnoAberto',
      render: (aberto: boolean) => (aberto ? 'Sim' : 'Não'),
    },
    {
      title: 'Aderência',
      dataIndex: 'aderencia',
      key: 'aderencia',
      render: (ader: number) => `${ader.toFixed(2)}%`,
    },
  ];

  return (
    <Card title="Relatório de Aderência de Equipes">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Card de Filtros para Seleção de Equipe */}
        <Card
          size="small"
          title={
            <Space>
              <FilterOutlined />
              <span>Filtros de Seleção</span>
            </Space>
          }
          style={{ marginBottom: '16px' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Base</div>
              <Select
                placeholder="Todas as bases"
                allowClear
                value={filtroBase}
                onChange={(value) => setFiltroBase(value || undefined)}
                options={basesOptions}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Tipo de Equipe</div>
              <Select
                placeholder="Todos os tipos"
                allowClear
                value={filtroTipoEquipe}
                onChange={(value) => setFiltroTipoEquipe(value || undefined)}
                options={tiposEquipeOptions}
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Buscar Equipe</div>
              <Input
                placeholder="Digite o nome da equipe"
                prefix={<SearchOutlined />}
                value={filtroBuscaEquipe}
                onChange={(e) => setFiltroBuscaEquipe(e.target.value)}
                allowClear
              />
            </Col>
          </Row>
        </Card>

        <Form form={form} layout="inline" onFinish={handleBuscar}>
          <Form.Item
            label="Equipe"
            name="equipeId"
            rules={[{ required: true, message: 'Selecione uma equipe' }]}
          >
            <Select
              style={{ width: 250 }}
              placeholder="Selecione a equipe"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={equipesOptions}
            />
          </Form.Item>

          <Form.Item
            label="Período"
            name="periodo"
            rules={[{ required: true, message: 'Selecione o período' }]}
          >
            <RangePicker format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Buscar
            </Button>
          </Form.Item>
        </Form>

        {/* Card de Filtros para Tabela */}
        {dados && (
          <Card
            size="small"
            title={
              <Space>
                <FilterOutlined />
                <span>Filtros da Tabela</span>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Status</div>
                <Select
                  placeholder="Todos"
                  allowClear
                  value={filtroStatus}
                  onChange={(value) => setFiltroStatus(value || undefined)}
                  style={{ width: '100%' }}
                  options={[
                    { label: 'Turno Aberto', value: 'aberto' },
                    { label: 'Turno Fechado', value: 'fechado' },
                    { label: 'Aderente (≥80%)', value: 'aderente' },
                    { label: 'Não Aderente (<80%)', value: 'nao_aderente' },
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Buscar por Eletricista</div>
                <Input
                  placeholder="Nome ou matrícula (em desenvolvimento)"
                  prefix={<SearchOutlined />}
                  value={filtroBuscaEletricista}
                  onChange={(e) => setFiltroBuscaEletricista(e.target.value)}
                  allowClear
                  disabled
                />
              </Col>
            </Row>
          </Card>
        )}

        {dados && (
          <>
            <Row gutter={16}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Dias Escalados"
                    value={dados.resumo.diasEscalados}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Dias Abertos"
                    value={dados.resumo.diasAbertos}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Aderência Dias"
                    value={dados.resumo.aderenciaDias}
                    suffix="%"
                    precision={2}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Aderência Eletricistas"
                    value={dados.resumo.aderenciaEletricistas}
                    suffix="%"
                    precision={2}
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={columns}
              dataSource={detalhamentoFiltrado}
              rowKey={(record) => {
                const data = record.data instanceof Date ? record.data.toISOString() : record.data;
                return String(data);
              }}
              pagination={pagination}
            />
          </>
        )}
      </Space>
    </Card>
  );
}
