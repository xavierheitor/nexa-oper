'use client';

import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Select,
  message,
  Tabs,
  Row,
  Col,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { listJustificativasEquipe } from '@/lib/actions/justificativa-equipe/list';
import { listCasosJustificativaEquipe } from '@/lib/actions/justificativa-equipe/listCasosPendentes';
import { aprovarJustificativaEquipe } from '@/lib/actions/justificativa-equipe/aprovar';
import { rejeitarJustificativaEquipe } from '@/lib/actions/justificativa-equipe/rejeitar';
import useSWR from 'swr';
import dayjs from 'dayjs';

interface JustificativaEquipeItem {
  id: number;
  dataReferencia: Date | string;
  equipe?: { nome?: string } | null;
  tipoJustificativa?: { nome?: string; geraFalta?: boolean } | null;
  status: 'pendente' | 'aprovada' | 'rejeitada' | string;
}

export interface JustificativaEquipeListResponse {
  data: JustificativaEquipeItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface CasoJustificativaEquipeItem {
  id: number;
  equipeId: number;
  dataReferencia: Date | string;
  status: 'pendente' | 'justificado' | 'ignorado';
  equipe: { nome: string };
  justificativaEquipe?: {
    id: number;
    status: 'pendente' | 'aprovada' | 'rejeitada';
  } | null;
}

export interface CasoJustificativaEquipeListResponse {
  items: CasoJustificativaEquipeItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface JustificativasEquipePageClientProps {
  initialJustificativas?: JustificativaEquipeListResponse;
  initialCasos?: CasoJustificativaEquipeListResponse;
}

export default function JustificativasEquipePageClient({
  initialJustificativas,
  initialCasos,
}: JustificativasEquipePageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('casos-pendentes');
  const [loading, setLoading] = useState(false);

  const [filtros, setFiltros] = useState({
    status: 'pendente' as 'pendente' | 'aprovada' | 'rejeitada' | undefined,
    page: 1,
    pageSize: 20,
  });

  const [filtrosCasos, setFiltrosCasos] = useState({
    status: 'pendente' as 'pendente' | 'justificado' | 'ignorado' | undefined,
    page: 1,
    pageSize: 20,
  });

  const justificativasFetcher = async (): Promise<JustificativaEquipeListResponse> => {
    const result = await listJustificativasEquipe(filtros);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao carregar justificativas');
    }
    return (result.data as unknown as JustificativaEquipeListResponse) ?? {
      data: [],
      total: 0,
      page: filtros.page,
      pageSize: filtros.pageSize,
    };
  };

  const casosFetcher = async (): Promise<CasoJustificativaEquipeListResponse> => {
    const result = await listCasosJustificativaEquipe(filtrosCasos);
    if (!result.success) {
      throw new Error(result.error || 'Erro ao carregar casos pendentes');
    }
    return (result.data as CasoJustificativaEquipeListResponse) ?? {
      items: [],
      total: 0,
      page: filtrosCasos.page,
      pageSize: filtrosCasos.pageSize,
    };
  };

  const {
    data: justificativasData,
    isLoading: isLoadingJustificativas,
    mutate: mutateJustificativas,
  } = useSWR<JustificativaEquipeListResponse>(
    ['justificativas-equipe', filtros],
    justificativasFetcher,
    {
      fallbackData: initialJustificativas,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const {
    data: casosData,
    isLoading: isLoadingCasos,
  } = useSWR<CasoJustificativaEquipeListResponse>(
    ['casos-justificativa-equipe', filtrosCasos],
    casosFetcher,
    {
      fallbackData: initialCasos,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleAprovar = async (id: number) => {
    setLoading(true);
    try {
      const result = await aprovarJustificativaEquipe({ id });
      if (result.success) {
        message.success('Justificativa aprovada com sucesso');
        await mutateJustificativas();
      } else {
        message.error(result.error || 'Erro ao aprovar justificativa');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async (id: number) => {
    setLoading(true);
    try {
      const result = await rejeitarJustificativaEquipe({ id });
      if (result.success) {
        message.success('Justificativa rejeitada');
        await mutateJustificativas();
      } else {
        message.error(result.error || 'Erro ao rejeitar justificativa');
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Data',
      dataIndex: 'dataReferencia',
      key: 'dataReferencia',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Equipe',
      dataIndex: ['equipe', 'nome'],
      key: 'equipe',
      render: (_: unknown, record: JustificativaEquipeItem) =>
        record.equipe?.nome || '-',
    },
    {
      title: 'Tipo',
      key: 'tipo',
      render: (_: unknown, record: JustificativaEquipeItem) =>
        record.tipoJustificativa?.nome || '-',
    },
    {
      title: 'Gera Falta',
      key: 'geraFalta',
      render: (_: unknown, record: JustificativaEquipeItem) => {
        const geraFalta = record.tipoJustificativa?.geraFalta ?? false;
        return (
          <Tag color={geraFalta ? 'red' : 'green'}>
            {geraFalta ? 'Sim' : 'Nao'}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const normalizedStatus =
          status === 'pendente' || status === 'aprovada' || status === 'rejeitada'
            ? status
            : 'pendente';
        const colors = {
          pendente: 'warning',
          aprovada: 'success',
          rejeitada: 'error',
        };
        return (
          <Tag color={colors[normalizedStatus]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Acoes',
      key: 'actions',
      render: (_: unknown, record: JustificativaEquipeItem) => {
        if (record.status !== 'pendente') {
          return null;
        }

        return (
          <Space>
            <Button
              type='primary'
              size='small'
              icon={<CheckOutlined />}
              onClick={() => handleAprovar(record.id)}
              loading={loading}
            >
              Aprovar
            </Button>
            <Button
              danger
              size='small'
              icon={<CloseOutlined />}
              onClick={() => handleRejeitar(record.id)}
              loading={loading}
            >
              Rejeitar
            </Button>
          </Space>
        );
      },
    },
  ];

  const casosColumns = [
    {
      title: 'Data',
      dataIndex: 'dataReferencia',
      key: 'dataReferencia',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Equipe',
      dataIndex: ['equipe', 'nome'],
      key: 'equipe',
    },
    {
      title: 'Justificado',
      key: 'justificado',
      render: (_: unknown, record: CasoJustificativaEquipeItem) => {
        if (
          record.justificativaEquipe &&
          record.justificativaEquipe.status === 'aprovada'
        ) {
          return <Tag color='success'>Sim</Tag>;
        }
        return <Tag color='default'>Nao</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pendente: 'warning',
          justificado: 'success',
          ignorado: 'default',
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Acoes',
      key: 'actions',
      render: (_: unknown, record: CasoJustificativaEquipeItem) => {
        if (record.status !== 'pendente') {
          return null;
        }

        const query = new URLSearchParams({
          casoId: String(record.id),
          equipeId: String(record.equipeId),
          dataReferencia: String(record.dataReferencia),
        });

        return (
          <Space>
            <Button
              type='primary'
              size='small'
              icon={<PlusOutlined />}
              onClick={() =>
                router.push(
                  `/dashboard/frequencia/justificativas-equipe/criar?${query.toString()}`
                )
              }
            >
              Criar Justificativa
            </Button>
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'casos-pendentes',
      label: 'Casos Pendentes',
      children: (
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <Card
            size='small'
            title={
              <Space>
                <FilterOutlined />
                <span>Filtros</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div
                  style={{
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  Status
                </div>
                <Select
                  style={{ width: '100%' }}
                  placeholder='Status'
                  value={filtrosCasos.status}
                  onChange={(value) =>
                    setFiltrosCasos((prev) => ({ ...prev, status: value, page: 1 }))
                  }
                  allowClear
                >
                  <Select.Option value='pendente'>Pendente</Select.Option>
                  <Select.Option value='justificado'>Justificado</Select.Option>
                  <Select.Option value='ignorado'>Ignorado</Select.Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Table
            columns={casosColumns}
            dataSource={casosData?.items || []}
            loading={isLoadingCasos}
            rowKey='id'
            pagination={{
              current: filtrosCasos.page,
              pageSize: filtrosCasos.pageSize,
              total: casosData?.total || 0,
              onChange: (page, pageSize) =>
                setFiltrosCasos((prev) => ({ ...prev, page, pageSize })),
            }}
          />
        </Space>
      ),
    },
    {
      key: 'justificativas',
      label: 'Justificativas Criadas',
      children: (
        <Space direction='vertical' style={{ width: '100%' }} size='large'>
          <Card
            size='small'
            title={
              <Space>
                <FilterOutlined />
                <span>Filtros</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <div
                  style={{
                    marginBottom: '4px',
                    fontSize: '12px',
                    color: '#666',
                  }}
                >
                  Status
                </div>
                <Select
                  style={{ width: '100%' }}
                  placeholder='Status'
                  value={filtros.status}
                  onChange={(value) =>
                    setFiltros((prev) => ({ ...prev, status: value, page: 1 }))
                  }
                  allowClear
                >
                  <Select.Option value='pendente'>Pendente</Select.Option>
                  <Select.Option value='aprovada'>Aprovada</Select.Option>
                  <Select.Option value='rejeitada'>Rejeitada</Select.Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={justificativasData?.data || []}
            loading={isLoadingJustificativas}
            rowKey='id'
            pagination={{
              current: filtros.page,
              pageSize: filtros.pageSize,
              total: justificativasData?.total || 0,
              onChange: (page, pageSize) =>
                setFiltros((prev) => ({ ...prev, page, pageSize })),
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card title='Justificativas de Equipe'>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Card>
  );
}
