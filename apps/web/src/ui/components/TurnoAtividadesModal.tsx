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
  Image,
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
import { listAtividadeAprs } from '@/lib/actions/atividade/listAprs';
import { listAtividadeFotos } from '@/lib/actions/atividade/listFotos';
import type {
  AtividadeExecucaoListItem,
  AtividadeMaterialListItem,
  AtividadeMedidorListItem,
} from '@/lib/types/atividadeDashboard';
import { handleRedirectToLogin } from '@/lib/utils/redirectHandler';
import { buildPhotoUrl } from '@/lib/utils/photos';
import { getTextFilter } from '@/ui/components/tableFilters';

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

interface AtividadeAprTurnoRow {
  id: number;
  aprUuid: string;
  preenchidaEm: string | Date;
  vinculadaAoServico: boolean;
  apr?: {
    id: number;
    nome: string;
  } | null;
  atividadeExecucao?: {
    id: number;
    atividadeUuid: string;
    numeroDocumento?: string | null;
    tipoAtividadeNomeSnapshot?: string | null;
    tipoServicoNomeSnapshot?: string | null;
  } | null;
  _count: {
    respostas: number;
    assinaturas: number;
  };
}

interface AtividadeFotoTurnoRow {
  id: string;
  origem: string;
  numeroDocumento: string | null;
  contexto: string | null;
  categoria: string | null;
  nomeArquivo: string | null;
  mimeType: string | null;
  url: string | null;
  path: string | null;
  createdAt: string | Date;
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
  const [aprs, setAprs] = useState<AtividadeAprTurnoRow[]>([]);
  const [fotos, setFotos] = useState<AtividadeFotoTurnoRow[]>([]);

  const fetchData = useCallback(async () => {
    if (!turnoId) return;

    setLoading(true);
    setError(null);

    try {
      const [
        atividadesResult,
        medidoresResult,
        materiaisResult,
        aprsResult,
        fotosResult,
      ] = await Promise.all([
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
        listAtividadeAprs({
          page: 1,
          pageSize: 200,
          turnoId,
        }),
        listAtividadeFotos({
          turnoId,
        }),
      ]);

      if (
        handleRedirectToLogin(atividadesResult) ||
        handleRedirectToLogin(medidoresResult) ||
        handleRedirectToLogin(materiaisResult) ||
        handleRedirectToLogin(aprsResult) ||
        handleRedirectToLogin(fotosResult)
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

      if (!aprsResult.success) {
        throw new Error(aprsResult.error || 'Erro ao buscar APRs.');
      }

      if (!fotosResult.success) {
        throw new Error(fotosResult.error || 'Erro ao buscar fotos.');
      }

      setAtividades(
        (atividadesResult.data?.data || []) as AtividadeExecucaoListItem[]
      );
      setMedidores(
        (medidoresResult.data?.data || []) as AtividadeMedidorListItem[]
      );
      setMateriais(
        (materiaisResult.data?.data || []) as AtividadeMaterialListItem[]
      );
      setAprs((aprsResult.data?.data || []) as AtividadeAprTurnoRow[]);
      setFotos((fotosResult.data?.data || []) as AtividadeFotoTurnoRow[]);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : 'Falha ao buscar atividades do turno.';
      setError(message);
      setAtividades([]);
      setMedidores([]);
      setMateriais([]);
      setAprs([]);
      setFotos([]);
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
  const totalAtividadesImprodutivas = atividades.filter(
    a => a.atividadeProdutiva === false
  ).length;
  const atividadesComMedidor = atividades.filter(a => a.aplicaMedidor).length;
  const atividadesComMaterial = atividades.filter(a => a.aplicaMaterial).length;
  const totalMedidores = medidores.length;
  const totalMateriais = materiais.length;
  const totalAprs = aprs.length;
  const totalFotos = fotos.length;

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
                    <Statistic
                      title='Improdutivas'
                      value={totalAtividadesImprodutivas}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic
                      title='Com Medidor'
                      value={atividadesComMedidor}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic
                      title='Com Material'
                      value={atividadesComMaterial}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic
                      title='Registros Medidor'
                      value={totalMedidores}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='APRs' value={totalAprs} />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={4}>
                  <Card size='small'>
                    <Statistic title='Fotos' value={totalFotos} />
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
                            render: (_, record) =>
                              record.numeroDocumento || '-',
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
                            title: 'Produtiva',
                            key: 'atividadeProdutiva',
                            width: 110,
                            render: (_, record) =>
                              record.atividadeProdutiva === false ? (
                                <Tag color='volcano'>Não</Tag>
                              ) : (
                                <Tag color='green'>Sim</Tag>
                              ),
                          },
                          {
                            title: 'Causa Improdutiva',
                            dataIndex: 'causaImprodutiva',
                            key: 'causaImprodutiva',
                            width: 220,
                            render: (value: string | null | undefined) =>
                              value || '-',
                            ...getTextFilter<AtividadeExecucaoListItem>(
                              'causaImprodutiva',
                              'causa improdutiva'
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
                              new Date(record.createdAt).toLocaleString(
                                'pt-BR'
                              ),
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
                            render: value => value || '-',
                          },
                          {
                            title: 'Nº Retirado',
                            dataIndex: 'retiradoNumero',
                            width: 140,
                            render: value => value || '-',
                          },
                          {
                            title: 'Leitura Retirada',
                            dataIndex: 'retiradoLeitura',
                            width: 150,
                            render: value => value || '-',
                          },
                          {
                            title: 'Somente Retirada',
                            dataIndex: 'somenteRetirada',
                            width: 140,
                            render: (value: boolean) =>
                              value ? (
                                <Tag color='orange'>Sim</Tag>
                              ) : (
                                <Tag>Não</Tag>
                              ),
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
                  {
                    key: 'apr',
                    label: `APR (${totalAprs})`,
                    children: (
                      <Table<AtividadeAprTurnoRow>
                        size='small'
                        rowKey='id'
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        dataSource={aprs}
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
                            title: 'APR',
                            key: 'aprNome',
                            render: (_, record) => record.apr?.nome || '-',
                          },
                          {
                            title: 'Respostas',
                            key: 'respostas',
                            width: 110,
                            render: (_, record) =>
                              record._count?.respostas ?? 0,
                          },
                          {
                            title: 'Assinaturas',
                            key: 'assinaturas',
                            width: 120,
                            render: (_, record) =>
                              record._count?.assinaturas ?? 0,
                          },
                          {
                            title: 'Vinculada Serviço',
                            dataIndex: 'vinculadaAoServico',
                            width: 150,
                            render: (value: boolean) =>
                              value ? (
                                <Tag color='green'>Sim</Tag>
                              ) : (
                                <Tag>Não</Tag>
                              ),
                          },
                          {
                            title: 'Preenchida em',
                            key: 'preenchidaEm',
                            width: 170,
                            render: (_, record) =>
                              new Date(record.preenchidaEm).toLocaleString(
                                'pt-BR'
                              ),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'fotos',
                    label: `Fotos (${totalFotos})`,
                    children: (
                      <Table<AtividadeFotoTurnoRow>
                        size='small'
                        rowKey='id'
                        pagination={{ pageSize: 12, showSizeChanger: true }}
                        dataSource={fotos}
                        columns={[
                          {
                            title: 'Origem',
                            dataIndex: 'origem',
                            width: 110,
                            render: (value: string) =>
                              value === 'Atividade' ? (
                                <Tag color='blue'>Atividade</Tag>
                              ) : (
                                <Tag color='orange'>Upload</Tag>
                              ),
                          },
                          {
                            title: 'Nº OS',
                            dataIndex: 'numeroDocumento',
                            width: 140,
                            render: (value: string | null) => value || '-',
                          },
                          {
                            title: 'Categoria',
                            dataIndex: 'categoria',
                            width: 170,
                            render: (value: string | null) => value || '-',
                          },
                          {
                            title: 'Contexto',
                            dataIndex: 'contexto',
                            width: 200,
                            render: (value: string | null) => value || '-',
                          },
                          {
                            title: 'Arquivo',
                            dataIndex: 'nomeArquivo',
                            render: (value: string | null) => value || '-',
                          },
                          {
                            title: 'Visualização',
                            key: 'preview',
                            width: 130,
                            render: (_, record) => {
                              const src = buildPhotoUrl(
                                record.url || undefined,
                                record.path || undefined
                              );
                              if (!src) return '-';
                              if (
                                !record.mimeType
                                  ?.toLowerCase()
                                  .startsWith('image/')
                              ) {
                                return (
                                  <a
                                    href={src}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                  >
                                    Abrir
                                  </a>
                                );
                              }
                              return (
                                <Image
                                  width={72}
                                  height={72}
                                  src={src}
                                  alt={record.nomeArquivo || 'Foto'}
                                  style={{ objectFit: 'cover' }}
                                />
                              );
                            },
                          },
                          {
                            title: 'Criado em',
                            key: 'createdAt',
                            width: 170,
                            render: (_, record) =>
                              new Date(record.createdAt).toLocaleString(
                                'pt-BR'
                              ),
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
          Visualização inicial para análise rápida por turno. Podemos evoluir
          com drill-down por atividade, fotos e exportação.
        </Text>
      </div>
    </Modal>
  );
}
