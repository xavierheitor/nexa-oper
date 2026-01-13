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
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import dayjs from 'dayjs';

/**
 * Página de lista de justificativas de equipe pendentes para aprovar
 */
export default function JustificativasEquipePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('casos-pendentes');

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

  const [loading, setLoading] = useState(false);

  const { data, refetch } = useDataFetch(async () => {
    const result = await listJustificativasEquipe(filtros);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao carregar justificativas');
  }, [filtros]);

  const { data: casosData } = useDataFetch(async () => {
    const result = await listCasosJustificativaEquipe(filtrosCasos);
    if (result.success) {
      return result.data;
    }
    throw new Error(result.error || 'Erro ao carregar casos pendentes');
  }, [filtrosCasos]);

  const handleAprovar = async (id: number) => {
    setLoading(true);
    try {
      const result = await aprovarJustificativaEquipe({ id });
      if (result.success) {
        message.success('Justificativa aprovada com sucesso');
        refetch();
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
        refetch();
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
    },
    {
      title: 'Tipo',
      dataIndex: ['tipoJustificativa', 'nome'],
      key: 'tipo',
    },
    {
      title: 'Gera Falta',
      dataIndex: ['tipoJustificativa', 'geraFalta'],
      key: 'geraFalta',
      render: (geraFalta: boolean) => (
        <Tag color={geraFalta ? 'red' : 'green'}>
          {geraFalta ? 'Sim' : 'Não'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pendente: 'warning',
          aprovada: 'success',
          rejeitada: 'error',
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {status.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => {
        if (record.status !== 'pendente') return null;
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
      render: (_: any, record: any) => {
        if (
          record.justificativaEquipe &&
          record.justificativaEquipe.status === 'aprovada'
        ) {
          return <Tag color='success'>Sim</Tag>;
        }
        return <Tag color='default'>Não</Tag>;
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
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: any) => {
        if (record.status !== 'pendente') return null;
        return (
          <Space>
            <Button
              type='primary'
              size='small'
              icon={<PlusOutlined />}
              onClick={() =>
                router.push(
                  `/dashboard/frequencia/justificativas-equipe/criar?casoId=${record.id}&equipeId=${record.equipeId}&dataReferencia=${record.dataReferencia}`
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
                  onChange={value =>
                    setFiltrosCasos({ ...filtrosCasos, status: value, page: 1 })
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
            loading={!casosData}
            rowKey='id'
            pagination={{
              current: filtrosCasos.page,
              pageSize: filtrosCasos.pageSize,
              total: casosData?.total || 0,
              onChange: (page, pageSize) =>
                setFiltrosCasos({ ...filtrosCasos, page, pageSize }),
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
                  onChange={value =>
                    setFiltros({ ...filtros, status: value, page: 1 })
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
            dataSource={data?.data || []}
            loading={!data}
            rowKey='id'
            pagination={{
              current: filtros.page,
              pageSize: filtros.pageSize,
              total: data?.total || 0,
              onChange: (page, pageSize) =>
                setFiltros({ ...filtros, page, pageSize }),
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
