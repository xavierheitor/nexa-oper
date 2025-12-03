'use client';

import { useState } from 'react';
import { Card, Form, Select, DatePicker, Button, Table, Statistic, Row, Col, Space } from 'antd';
import { getAderenciaEquipe } from '@/lib/actions/turno-realizado/getAderenciaEquipe';
import { useTablePagination } from '@/lib/hooks/useTablePagination';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

/**
 * Página de relatório de aderência de equipes
 */
export default function AderenciaEquipePage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any>(null);

  // Hook para paginação client-side
  const { pagination } = useTablePagination({
    defaultPageSize: 10,
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
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
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
        <Form form={form} layout="inline" onFinish={handleBuscar}>
          <Form.Item
            label="Equipe"
            name="equipeId"
            rules={[{ required: true }]}
          >
            <Select style={{ width: 200 }} placeholder="Selecione a equipe">
              {/* TODO: Carregar equipes dinamicamente */}
            </Select>
          </Form.Item>

          <Form.Item
            label="Período"
            name="periodo"
            rules={[{ required: true }]}
          >
            <RangePicker format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Buscar
            </Button>
          </Form.Item>
        </Form>

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
              dataSource={dados.detalhamento}
              rowKey="data"
              pagination={pagination}
            />
          </>
        )}
      </Space>
    </Card>
  );
}

