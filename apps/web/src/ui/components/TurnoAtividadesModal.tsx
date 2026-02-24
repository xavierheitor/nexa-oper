'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AppstoreOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { listAtividadeExecucoes } from '@/lib/actions/atividade/listExecucoes';
import { listAtividadeMateriais } from '@/lib/actions/atividade/listMateriais';
import { listAtividadeMedidores } from '@/lib/actions/atividade/listMedidores';
import type {
  AtividadeExecucaoListItem,
  AtividadeMaterialListItem,
  AtividadeMedidorListItem,
} from '@/lib/types/atividadeDashboard';
import { handleRedirectToLogin } from '@/lib/utils/redirectHandler';

const { Text } = Typography;

interface TurnoAtividadesModalProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  turnoInfo?: {
    veiculoPlaca?: string;
    equipeNome?: string;
    dataInicio?: string;
  };
}

export default function TurnoAtividadesModal({
  visible,
  onClose,
  turnoId,
  turnoInfo,
}: TurnoAtividadesModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atividades, setAtividades] = useState<AtividadeExecucaoListItem[]>([]);
  const [medidores, setMedidores] = useState<AtividadeMedidorListItem[]>([]);
  const [materiais, setMateriais] = useState<AtividadeMaterialListItem[]>([]);

  const fetchData = useCallback(async () => {
    if (!turnoId) return;

    setLoading(true);
    setError(null);

    try {
      const [atividadesResult, medidoresResult, materiaisResult] =
        await Promise.all([
          listAtividadeExecucoes({
            page: 1,
            pageSize: 200,
            orderBy: 'createdAt',
            orderDir: 'desc',
            turnoId,
          }),
          listAtividadeMedidores({
            page: 1,
            pageSize: 200,
            orderBy: 'createdAt',
            orderDir: 'desc',
            turnoId,
          }),
          listAtividadeMateriais({
            page: 1,
            pageSize: 200,
            orderBy: 'createdAt',
            orderDir: 'desc',
            turnoId,
          }),
        ]);

      if (
        handleRedirectToLogin(atividadesResult) ||
        handleRedirectToLogin(medidoresResult) ||
        handleRedirectToLogin(materiaisResult)
      ) {
        return;
      }

      if (!atividadesResult.success) {
        throw new Error(atividadesResult.error || 'Erro ao buscar atividades.');
      }

      if (!medidoresResult.success) {
        throw new Error(medidoresResult.error || 'Erro ao buscar medidores.');
      }

      if (!materiaisResult.success) {
        throw new Error(materiaisResult.error || 'Erro ao buscar materiais.');
      }

      setAtividades((atividadesResult.data?.data || []) as AtividadeExecucaoListItem[]);
      setMedidores((medidoresResult.data?.data || []) as AtividadeMedidorListItem[]);
      setMateriais((materiaisResult.data?.data || []) as AtividadeMaterialListItem[]);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'Falha ao buscar atividades do turno.';
      setError(message);
      setAtividades([]);
      setMedidores([]);
      setMateriais([]);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    if (visible && turnoId) {
      fetchData();
    }
  }, [visible, turnoId, fetchData]);

  const totalAtividades = atividades.length;
  const atividadesComMedidor = atividades.filter((a) => a.aplicaMedidor).length;
  const atividadesComMaterial = atividades.filter((a) => a.aplicaMaterial).length;
  const totalMedidores = medidores.length;
  const totalMateriais = materiais.length;

  return (
    <Modal
      title={
        <Space>
          <AppstoreOutlined />
          <span>Atividades do Turno #{turnoId}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnHidden
    >
      <Card size='small' style={{ marginBottom: 16 }}>
        <Descriptions size='small' column={3}>
          <Descriptions.Item label='Turno'>#{turnoId}</Descriptions.Item>
          <Descriptions.Item label='Veículo'>
            {turnoInfo?.veiculoPlaca || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Equipe'>
            {turnoInfo?.equipeNome || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Início'>
            {turnoInfo?.dataInicio
              ? new Date(turnoInfo.dataInicio).toLocaleString('pt-BR')
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Ações'>
            <Button
              icon={<ReloadOutlined />}
              size='small'
              onClick={fetchData}
              loading={loading}
            >
              Atualizar
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size='large' />
        </div>
      ) : (
        <>
          {error && (
            <Alert
              type='error'
              showIcon
              message='Erro ao carregar atividades do turno'
              description={error}
              style={{ marginBottom: 16 }}
            />
          )}

          {!error && totalAtividades === 0 ? (
            <Empty description='Nenhuma atividade encontrada para este turno.' />
          ) : (
            <>
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='Atividades' value={totalAtividades} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='Com Medidor' value={atividadesComMedidor} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='Com Material' value={atividadesComMaterial} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='Registros Medidor' value={totalMedidores} />
                  </Card>
                </Col>
              </Row>

              <Tabs
                items={[
                  {
                    key: 'atividades',
                    label: `Atividades (${totalAtividades})`,
                    children: (
                      <Table<AtividadeExecucaoListItem>
                        size='small'
                        rowKey='id'
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        dataSource={atividades}
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 80 },
                          {
                            title: 'Nº OS',
                            key: 'numeroDocumento',
                            width: 140,
                            render: (_, record) => record.numeroDocumento || '-',
                          },
                          {
                            title: 'Tipo',
                            key: 'tipo',
                            render: (_, record) =>
                              record.tipoAtividade?.nome ||
                              record.tipoAtividadeNomeSnapshot ||
                              '-',
                          },
                          {
                            title: 'Subtipo',
                            key: 'subtipo',
                            render: (_, record) =>
                              record.tipoAtividadeServico?.nome ||
                              record.tipoServicoNomeSnapshot ||
                              '-',
                          },
                          {
                            title: 'Medidor',
                            key: 'aplicaMedidor',
                            width: 100,
                            render: (_, record) =>
                              record.aplicaMedidor ? (
                                <Tag color='blue'>Sim</Tag>
                              ) : (
                                <Tag>Não</Tag>
                              ),
                          },
                          {
                            title: 'Material',
                            key: 'aplicaMaterial',
                            width: 100,
                            render: (_, record) =>
                              record.aplicaMaterial ? (
                                <Tag color='cyan'>Sim</Tag>
                              ) : (
                                <Tag>Não</Tag>
                              ),
                          },
                          {
                            title: 'Status',
                            dataIndex: 'statusFluxo',
                            width: 160,
                          },
                          {
                            title: 'Criado em',
                            key: 'createdAt',
                            width: 160,
                            render: (_, record) =>
                              new Date(record.createdAt).toLocaleString('pt-BR'),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'medidores',
                    label: `Medidores (${totalMedidores})`,
                    children: (
                      <Table<AtividadeMedidorListItem>
                        size='small'
                        rowKey='id'
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        dataSource={medidores}
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 80 },
                          {
                            title: 'Nº OS',
                            key: 'numeroDocumento',
                            width: 140,
                            render: (_, record) =>
                              record.atividadeExecucao?.numeroDocumento || '-',
                          },
                          {
                            title: 'Nº Instalado',
                            dataIndex: 'instaladoNumero',
                            width: 140,
                            render: (value) => value || '-',
                          },
                          {
                            title: 'Nº Retirado',
                            dataIndex: 'retiradoNumero',
                            width: 140,
                            render: (value) => value || '-',
                          },
                          {
                            title: 'Leitura Retirada',
                            dataIndex: 'retiradoLeitura',
                            width: 150,
                            render: (value) => value || '-',
                          },
                          {
                            title: 'Somente Retirada',
                            dataIndex: 'somenteRetirada',
                            width: 140,
                            render: (value: boolean) =>
                              value ? <Tag color='orange'>Sim</Tag> : <Tag>Não</Tag>,
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'materiais',
                    label: `Materiais (${totalMateriais})`,
                    children: (
                      <Table<AtividadeMaterialListItem>
                        size='small'
                        rowKey='id'
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        dataSource={materiais}
                        columns={[
                          { title: 'ID', dataIndex: 'id', width: 80 },
                          {
                            title: 'Nº OS',
                            key: 'numeroDocumento',
                            width: 140,
                            render: (_, record) =>
                              record.atividadeExecucao?.numeroDocumento || '-',
                          },
                          {
                            title: 'Código',
                            dataIndex: 'materialCodigoSnapshot',
                            width: 120,
                          },
                          {
                            title: 'Material',
                            dataIndex: 'materialDescricaoSnapshot',
                          },
                          {
                            title: 'Qtd',
                            dataIndex: 'quantidade',
                            width: 120,
                            render: (value: number) =>
                              value.toLocaleString('pt-BR'),
                          },
                          {
                            title: 'Unidade',
                            dataIndex: 'unidadeMedidaSnapshot',
                            width: 120,
                          },
                        ]}
                      />
                    ),
                  },
                ]}
              />
            </>
          )}
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <Text type='secondary'>
          Visualização inicial para análise rápida por turno. Podemos evoluir com
          drill-down por atividade, fotos e exportação.
        </Text>
      </div>
    </Modal>
  );
}
