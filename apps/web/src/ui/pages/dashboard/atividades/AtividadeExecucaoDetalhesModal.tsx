'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { getAtividadeExecucaoDetalhe } from '@/lib/actions/atividade/getExecucaoDetalhe';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import type {
  AtividadeAprAssinaturaDetalhe,
  AtividadeAprPreenchidaDetalhe,
  AtividadeAprRespostaDetalhe,
  AtividadeEventoDetalhe,
  AtividadeExecucaoDetalhe,
  AtividadeFormRespostaDetalhe,
  AtividadeMaterialDetalhe,
  AtividadeUploadEvidenceDetalhe,
} from '@/lib/types/atividadeDashboard';
import { buildPhotoUrl } from '@/lib/utils/photos';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Image,
  Modal,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo } from 'react';

const { Text, Paragraph } = Typography;

interface AtividadeExecucaoDetalhesModalProps {
  open: boolean;
  atividadeId: number | null;
  onClose: () => void;
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function isImageMimeType(mimeType?: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith('image/'));
}

function getOrigemColor(origem: string) {
  if (origem === 'Medidor') return 'geekblue';
  if (origem === 'Resposta') return 'green';
  if (origem === 'APR') return 'purple';
  if (origem === 'Checklist') return 'magenta';
  return 'default';
}

function mapEvidenceToOrigemContexto(
  evidencia: AtividadeUploadEvidenceDetalhe
): {
  origem: string;
  contexto: string;
} {
  const category = (evidencia.photoCategory || '').toUpperCase();
  const atividadeContexto = (evidencia.atividadeContexto || '').toLowerCase();
  const tipo = (evidencia.tipo || '').toLowerCase();
  const ownerType = (evidencia.ownerType || '').toLowerCase();

  if (category === 'MEDIDOR_INSTALADO') {
    return { origem: 'Medidor', contexto: 'Foto do medidor instalado' };
  }
  if (category === 'MEDIDOR_RETIRADO') {
    return { origem: 'Medidor', contexto: 'Foto do medidor retirado' };
  }
  if (category === 'MEDIDOR') {
    return { origem: 'Medidor', contexto: 'Foto de medidor' };
  }

  if (atividadeContexto === 'medidor:instalado') {
    return { origem: 'Medidor', contexto: 'Foto do medidor instalado' };
  }
  if (atividadeContexto === 'medidor:retirado') {
    return { origem: 'Medidor', contexto: 'Foto do medidor retirado' };
  }

  if (
    category === 'ATIVIDADE_SERVICO' ||
    atividadeContexto.startsWith('form:')
  ) {
    return { origem: 'Resposta', contexto: 'Foto da resposta do formulário' };
  }
  if (
    category === 'ATIVIDADE_FINALIZACAO' ||
    atividadeContexto === 'finalizacao'
  ) {
    return {
      origem: 'Atividade',
      contexto: 'Foto de finalização da atividade',
    };
  }

  if (category === 'APR_EVIDENCIA' || category === 'APR_ASSINATURA') {
    return { origem: 'APR', contexto: 'Evidência da APR' };
  }

  if (category === 'CHECKLIST_REPROVA') {
    return {
      origem: 'Checklist',
      contexto: 'Evidência de pendência do checklist',
    };
  }
  if (category === 'CHECKLIST_ASSINATURA') {
    return { origem: 'Checklist', contexto: 'Assinatura do checklist' };
  }

  if (
    tipo === 'medidor' ||
    ownerType === 'atividademedidor' ||
    ownerType === 'medidor'
  ) {
    return { origem: 'Medidor', contexto: 'Foto de medidor' };
  }
  if (tipo === 'apr-evidence' || ownerType === 'apr') {
    return { origem: 'APR', contexto: 'Evidência da APR' };
  }

  return { origem: 'Atividade', contexto: 'Foto da atividade' };
}

function isMedidorInstaladoEvidence(evidencia: AtividadeUploadEvidenceDetalhe) {
  const category = (evidencia.photoCategory || '').toUpperCase();
  const atividadeContexto = (evidencia.atividadeContexto || '').toLowerCase();
  return (
    category === 'MEDIDOR_INSTALADO' ||
    atividadeContexto === 'medidor:instalado'
  );
}

function isMedidorRetiradoEvidence(evidencia: AtividadeUploadEvidenceDetalhe) {
  const category = (evidencia.photoCategory || '').toUpperCase();
  const atividadeContexto = (evidencia.atividadeContexto || '').toLowerCase();
  return (
    category === 'MEDIDOR_RETIRADO' || atividadeContexto === 'medidor:retirado'
  );
}

function renderMediaPreview(
  media: Pick<
    AtividadeUploadEvidenceDetalhe,
    'url' | 'mimeType' | 'nomeArquivo' | 'path'
  > & {
    fallbackPath?: string;
  }
) {
  const mediaUrl = buildPhotoUrl(media.url, media.fallbackPath || media.path);
  if (!mediaUrl) return '-';

  if (isImageMimeType(media.mimeType)) {
    return (
      <Image width={96} src={mediaUrl} alt={media.nomeArquivo || 'Imagem'} />
    );
  }

  return (
    <a href={mediaUrl} target='_blank' rel='noopener noreferrer'>
      Abrir arquivo
    </a>
  );
}

function mapRespostaTexto(aprResposta: AtividadeAprRespostaDetalhe) {
  if (aprResposta.respostaTexto) return aprResposta.respostaTexto;
  if (typeof aprResposta.marcado === 'boolean') {
    return aprResposta.marcado ? 'Marcado' : 'Não marcado';
  }
  if (aprResposta.opcaoNomeSnapshot) return aprResposta.opcaoNomeSnapshot;
  return '-';
}

export default function AtividadeExecucaoDetalhesModal({
  open,
  atividadeId,
  onClose,
}: AtividadeExecucaoDetalhesModalProps) {
  const {
    data: detalhe,
    loading,
    error,
    refetch,
    reset,
  } = useDataFetch<AtividadeExecucaoDetalhe | null>(
    async () => {
      if (!atividadeId) return null;
      const result = await getAtividadeExecucaoDetalhe({ id: atividadeId });

      if (!result.success) {
        throw new Error(
          result.error || 'Erro ao carregar detalhes da atividade'
        );
      }

      return result.data || null;
    },
    [atividadeId],
    { immediate: false }
  );

  useEffect(() => {
    if (open && atividadeId) {
      void refetch();
    } else if (!open) {
      reset();
    }
  }, [open, atividadeId, refetch, reset]);

  const materiaisColumns: ColumnsType<AtividadeMaterialDetalhe> = [
    { title: 'Código', dataIndex: 'materialCodigoSnapshot', width: 150 },
    { title: 'Material', dataIndex: 'materialDescricaoSnapshot' },
    {
      title: 'Qtd',
      dataIndex: 'quantidade',
      width: 120,
      render: (value: number) => value.toLocaleString('pt-BR'),
    },
    { title: 'Unidade', dataIndex: 'unidadeMedidaSnapshot', width: 120 },
  ];

  const respostasColumns: ColumnsType<AtividadeFormRespostaDetalhe> = [
    {
      title: 'Pergunta',
      dataIndex: 'perguntaTituloSnapshot',
      width: 320,
    },
    {
      title: 'Resposta',
      dataIndex: 'respostaTexto',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Obrigava Foto',
      dataIndex: 'obrigaFotoSnapshot',
      width: 130,
      render: (value: boolean) =>
        value ? <Tag color='orange'>Sim</Tag> : <Tag>Não</Tag>,
    },
    {
      title: 'Foto',
      key: 'foto',
      width: 140,
      render: (_, record) =>
        record.foto
          ? renderMediaPreview({
              url: record.foto.url,
              mimeType: record.foto.mimeType,
              nomeArquivo: record.foto.fileName || undefined,
              path: record.foto.storagePath,
              fallbackPath: record.foto.storagePath,
            })
          : '-',
    },
    {
      title: 'Respondido em',
      dataIndex: 'dataResposta',
      width: 170,
      render: (value: Date | string) => formatDateTime(value),
    },
  ];

  const eventosColumns: ColumnsType<AtividadeEventoDetalhe> = [
    { title: 'Tipo', dataIndex: 'tipoEvento', width: 180 },
    {
      title: 'Localização',
      key: 'coords',
      width: 220,
      render: (_, record) =>
        record.latitude != null && record.longitude != null
          ? `${record.latitude}, ${record.longitude}`
          : '-',
    },
    {
      title: 'Detalhe',
      dataIndex: 'detalhe',
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Capturado em',
      dataIndex: 'capturadoEm',
      width: 170,
      render: (value: Date | string) => formatDateTime(value),
    },
  ];

  const fotosConsolidadas = useMemo(() => {
    if (!detalhe) return [];

    const rows: Array<{
      key: string;
      origem: string;
      contexto: string;
      nomeArquivo: string;
      mimeType: string;
      criadoEm: Date | string;
      url: string;
      mimeTypeRaw?: string | null;
      path: string;
      fallbackPath: string;
    }> = [];
    const seen = new Set<string>();

    const pushRow = (row: {
      key: string;
      origem: string;
      contexto: string;
      nomeArquivo: string;
      mimeType: string;
      criadoEm: Date | string;
      url: string;
      mimeTypeRaw?: string | null;
      path: string;
      fallbackPath: string;
    }) => {
      const dedupeKey = `${row.url}|${row.path}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);
      rows.push(row);
    };

    detalhe.atividadeFotos.forEach(foto => {
      pushRow({
        key: `atividade-foto-${foto.id}`,
        origem: 'Atividade',
        contexto: foto.contexto || '-',
        nomeArquivo: foto.fileName || '-',
        mimeType: foto.mimeType || '-',
        criadoEm: foto.createdAt,
        url: foto.url,
        mimeTypeRaw: foto.mimeType,
        path: foto.storagePath,
        fallbackPath: foto.storagePath,
      });
    });

    if (detalhe.atividadeMedidor?.instaladoFoto) {
      const foto = detalhe.atividadeMedidor.instaladoFoto;
      pushRow({
        key: `medidor-instalado-${foto.id}`,
        origem: 'Medidor',
        contexto: 'Foto do medidor instalado',
        nomeArquivo: foto.fileName || '-',
        mimeType: foto.mimeType || '-',
        criadoEm: foto.createdAt,
        url: foto.url,
        mimeTypeRaw: foto.mimeType,
        path: foto.storagePath,
        fallbackPath: foto.storagePath,
      });
    }

    if (detalhe.atividadeMedidor?.retiradoFoto) {
      const foto = detalhe.atividadeMedidor.retiradoFoto;
      pushRow({
        key: `medidor-retirado-${foto.id}`,
        origem: 'Medidor',
        contexto: 'Foto do medidor retirado',
        nomeArquivo: foto.fileName || '-',
        mimeType: foto.mimeType || '-',
        criadoEm: foto.createdAt,
        url: foto.url,
        mimeTypeRaw: foto.mimeType,
        path: foto.storagePath,
        fallbackPath: foto.storagePath,
      });
    }

    detalhe.atividadeFormRespostas.forEach(resposta => {
      if (!resposta.foto) return;
      const foto = resposta.foto;
      pushRow({
        key: `resposta-foto-${resposta.id}-${foto.id}`,
        origem: 'Resposta',
        contexto: resposta.perguntaTituloSnapshot || 'Foto da resposta',
        nomeArquivo: foto.fileName || '-',
        mimeType: foto.mimeType || '-',
        criadoEm: foto.createdAt,
        url: foto.url,
        mimeTypeRaw: foto.mimeType,
        path: foto.storagePath,
        fallbackPath: foto.storagePath,
      });
    });

    detalhe.uploadEvidenciasAtividade.forEach(evidencia => {
      const mapped = mapEvidenceToOrigemContexto(evidencia);
      pushRow({
        key: `upload-evidencia-${evidencia.id}`,
        origem: mapped.origem,
        contexto: mapped.contexto,
        nomeArquivo: evidencia.nomeArquivo || evidencia.path,
        mimeType: evidencia.mimeType || '-',
        criadoEm: evidencia.createdAt,
        url: evidencia.url,
        mimeTypeRaw: evidencia.mimeType,
        path: evidencia.path,
        fallbackPath: evidencia.path,
      });
    });

    detalhe.atividadeAprPreenchidas.forEach(apr => {
      apr.evidenciasUpload.forEach(evidencia => {
        pushRow({
          key: `apr-evidencia-${apr.id}-${evidencia.id}`,
          origem: 'APR',
          contexto: apr.apr?.nome || 'Evidência APR',
          nomeArquivo: evidencia.nomeArquivo || evidencia.path,
          mimeType: evidencia.mimeType || '-',
          criadoEm: evidencia.createdAt,
          url: evidencia.url,
          mimeTypeRaw: evidencia.mimeType,
          path: evidencia.path,
          fallbackPath: evidencia.path,
        });
      });
    });

    return rows;
  }, [detalhe]);

  const medidorInstaladoUpload = useMemo(() => {
    if (!detalhe) return null;
    return (
      detalhe.uploadEvidenciasAtividade.find(isMedidorInstaladoEvidence) || null
    );
  }, [detalhe]);

  const medidorRetiradoUpload = useMemo(() => {
    if (!detalhe) return null;
    return (
      detalhe.uploadEvidenciasAtividade.find(isMedidorRetiradoEvidence) || null
    );
  }, [detalhe]);

  const aprRespostaColumns: ColumnsType<AtividadeAprRespostaDetalhe> = [
    {
      title: 'Grupo',
      dataIndex: 'grupoNomeSnapshot',
      width: 220,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Pergunta',
      dataIndex: 'perguntaNomeSnapshot',
      width: 320,
    },
    {
      title: 'Resposta',
      key: 'resposta',
      render: (_, record) => mapRespostaTexto(record),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoRespostaSnapshot',
      width: 120,
    },
  ];

  const aprAssinaturasColumns: ColumnsType<AtividadeAprAssinaturaDetalhe> = [
    { title: 'Assinante', dataIndex: 'nomeAssinante' },
    {
      title: 'Matrícula',
      dataIndex: 'matriculaAssinante',
      width: 140,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: 'Extra',
      dataIndex: 'assinanteExtra',
      width: 100,
      render: (value: boolean) =>
        value ? <Tag color='purple'>Sim</Tag> : <Tag>Não</Tag>,
    },
    {
      title: 'Data',
      dataIndex: 'assinaturaData',
      width: 170,
      render: (value: Date | string) => formatDateTime(value),
    },
  ];

  const aprItems = (detalhe?.atividadeAprPreenchidas || []).map(
    (apr: AtividadeAprPreenchidaDetalhe) => ({
      key: String(apr.id),
      label: `${apr.apr?.nome || 'APR'} - ${formatDateTime(apr.preenchidaEm)}`,
      children: (
        <Space direction='vertical' style={{ width: '100%' }} size={12}>
          <Descriptions size='small' column={3} bordered>
            <Descriptions.Item label='UUID'>{apr.aprUuid}</Descriptions.Item>
            <Descriptions.Item label='Vinculada ao Serviço'>
              {apr.vinculadaAoServico ? (
                <Tag color='green'>Sim</Tag>
              ) : (
                <Tag color='orange'>Não</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label='Preenchida em'>
              {formatDateTime(apr.preenchidaEm)}
            </Descriptions.Item>
          </Descriptions>

          <Card size='small' title='Observações'>
            <Paragraph style={{ marginBottom: 0 }}>
              {apr.observacoes || 'Sem observações'}
            </Paragraph>
          </Card>

          <Card size='small' title={`Respostas (${apr.respostas.length})`}>
            <Table<AtividadeAprRespostaDetalhe>
              size='small'
              rowKey='id'
              pagination={false}
              columns={aprRespostaColumns}
              dataSource={apr.respostas}
              locale={{ emptyText: 'Sem respostas na APR.' }}
            />
          </Card>

          <Card size='small' title={`Assinaturas (${apr.assinaturas.length})`}>
            <Table<AtividadeAprAssinaturaDetalhe>
              size='small'
              rowKey='id'
              pagination={false}
              columns={aprAssinaturasColumns}
              dataSource={apr.assinaturas}
              locale={{ emptyText: 'Sem assinaturas na APR.' }}
            />
          </Card>

          <Card
            size='small'
            title={`Evidências APR (${apr.evidenciasUpload.length})`}
          >
            <Table<AtividadeUploadEvidenceDetalhe>
              size='small'
              rowKey={record =>
                `${record.id}-${record.ownerRef || record.entityId}-${record.createdAt}`
              }
              pagination={false}
              dataSource={apr.evidenciasUpload}
              locale={{ emptyText: 'Sem evidências de APR.' }}
              columns={[
                {
                  title: 'Arquivo',
                  key: 'arquivo',
                  render: (_, record) =>
                    renderMediaPreview({
                      url: record.url,
                      mimeType: record.mimeType,
                      nomeArquivo: record.nomeArquivo || undefined,
                      path: record.path,
                    }),
                },
                {
                  title: 'Mime Type',
                  dataIndex: 'mimeType',
                  width: 180,
                  render: (value: string | null | undefined) => value || '-',
                },
                {
                  title: 'Enviado em',
                  dataIndex: 'createdAt',
                  width: 170,
                  render: (value: Date | string) => formatDateTime(value),
                },
              ]}
            />
          </Card>
        </Space>
      ),
    })
  );

  const legendaFotos = [
    {
      origem: 'Atividade',
      descricao: 'Foto geral vinculada à execução da atividade.',
    },
    { origem: 'Medidor', descricao: 'Foto do medidor instalado ou retirado.' },
    {
      origem: 'Resposta',
      descricao: 'Foto anexada a uma resposta do formulário.',
    },
    { origem: 'APR', descricao: 'Evidência fotográfica enviada na APR.' },
    {
      origem: 'Checklist',
      descricao: 'Evidência ou assinatura vinculada ao checklist.',
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span>Detalhes da Atividade</span>
          {detalhe?.numeroDocumento ? (
            <Tag color='blue'>OS {detalhe.numeroDocumento}</Tag>
          ) : null}
          {atividadeId ? <Text type='secondary'>#{atividadeId}</Text> : null}
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={1280}
      destroyOnHidden
    >
      <Card size='small' style={{ marginBottom: 12 }}>
        <Descriptions size='small' column={4}>
          <Descriptions.Item label='Tipo'>
            {detalhe?.tipoAtividade?.nome ||
              detalhe?.tipoAtividadeNomeSnapshot ||
              '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Subtipo'>
            {detalhe?.tipoAtividadeServico?.nome ||
              detalhe?.tipoServicoNomeSnapshot ||
              '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Equipe'>
            {detalhe?.turno?.equipe?.nome || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Placa'>
            {detalhe?.turno?.veiculo?.placa || '-'}
          </Descriptions.Item>
          <Descriptions.Item label='Dia do Turno'>
            {formatDate(detalhe?.turno?.dataInicio)}
          </Descriptions.Item>
          <Descriptions.Item label='Status'>
            {detalhe?.statusFluxo ? (
              <Tag color='processing'>{detalhe.statusFluxo}</Tag>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label='Criado em'>
            {formatDateTime(detalhe?.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label='Atualizar'>
            <Button
              icon={<ReloadOutlined />}
              size='small'
              onClick={() => void refetch()}
              loading={loading}
              disabled={!atividadeId}
            >
              Recarregar
            </Button>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size='large' />
        </div>
      ) : null}

      {!loading && error ? (
        <Alert
          type='error'
          showIcon
          message='Erro ao carregar detalhes da atividade'
          description={error}
          style={{ marginBottom: 12 }}
        />
      ) : null}

      {!loading && !error && !detalhe ? (
        <Empty description='Atividade não encontrada' />
      ) : null}

      {!loading && !error && detalhe ? (
        <>
          {detalhe.observacoesFinalizacao ? (
            <Card
              size='small'
              title='Observações da Atividade'
              style={{ marginBottom: 12 }}
            >
              <Paragraph style={{ marginBottom: 0 }}>
                {detalhe.observacoesFinalizacao}
              </Paragraph>
            </Card>
          ) : null}

          <Tabs
            items={[
              {
                key: 'medidor',
                label: 'Medidor',
                children: detalhe.atividadeMedidor ? (
                  <Space
                    direction='vertical'
                    style={{ width: '100%' }}
                    size={12}
                  >
                    <Descriptions bordered size='small' column={2}>
                      <Descriptions.Item label='Somente Retirada'>
                        {detalhe.atividadeMedidor.somenteRetirada ? (
                          <Tag color='orange'>Sim</Tag>
                        ) : (
                          <Tag>Não</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label='Nº Instalado'>
                        {detalhe.atividadeMedidor.instaladoNumero || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label='Status Retirado'>
                        {detalhe.atividadeMedidor.retiradoStatus || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label='Nº Retirado'>
                        {detalhe.atividadeMedidor.retiradoNumero || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label='Leitura Retirada'>
                        {detalhe.atividadeMedidor.retiradoLeitura || '-'}
                      </Descriptions.Item>
                    </Descriptions>

                    <Card size='small' title='Fotos de Medidor'>
                      <Space size={24}>
                        <div>
                          <Text strong>Instalado:</Text>
                          <div style={{ marginTop: 8 }}>
                            {detalhe.atividadeMedidor.instaladoFoto
                              ? renderMediaPreview({
                                  url: detalhe.atividadeMedidor.instaladoFoto
                                    .url,
                                  mimeType:
                                    detalhe.atividadeMedidor.instaladoFoto
                                      .mimeType,
                                  nomeArquivo:
                                    detalhe.atividadeMedidor.instaladoFoto
                                      .fileName || undefined,
                                  path: detalhe.atividadeMedidor.instaladoFoto
                                    .storagePath,
                                  fallbackPath:
                                    detalhe.atividadeMedidor.instaladoFoto
                                      .storagePath,
                                })
                              : medidorInstaladoUpload
                                ? renderMediaPreview({
                                    url: medidorInstaladoUpload.url,
                                    mimeType: medidorInstaladoUpload.mimeType,
                                    nomeArquivo:
                                      medidorInstaladoUpload.nomeArquivo ||
                                      undefined,
                                    path: medidorInstaladoUpload.path,
                                    fallbackPath: medidorInstaladoUpload.path,
                                  })
                                : '-'}
                          </div>
                        </div>
                        <div>
                          <Text strong>Retirado:</Text>
                          <div style={{ marginTop: 8 }}>
                            {detalhe.atividadeMedidor.retiradoFoto
                              ? renderMediaPreview({
                                  url: detalhe.atividadeMedidor.retiradoFoto
                                    .url,
                                  mimeType:
                                    detalhe.atividadeMedidor.retiradoFoto
                                      .mimeType,
                                  nomeArquivo:
                                    detalhe.atividadeMedidor.retiradoFoto
                                      .fileName || undefined,
                                  path: detalhe.atividadeMedidor.retiradoFoto
                                    .storagePath,
                                  fallbackPath:
                                    detalhe.atividadeMedidor.retiradoFoto
                                      .storagePath,
                                })
                              : medidorRetiradoUpload
                                ? renderMediaPreview({
                                    url: medidorRetiradoUpload.url,
                                    mimeType: medidorRetiradoUpload.mimeType,
                                    nomeArquivo:
                                      medidorRetiradoUpload.nomeArquivo ||
                                      undefined,
                                    path: medidorRetiradoUpload.path,
                                    fallbackPath: medidorRetiradoUpload.path,
                                  })
                                : '-'}
                          </div>
                        </div>
                      </Space>
                    </Card>
                  </Space>
                ) : (
                  <Empty description='Atividade sem dados de medidor.' />
                ),
              },
              {
                key: 'materiais',
                label: `Materiais (${detalhe.atividadeMateriaisAplicados.length})`,
                children: (
                  <Table<AtividadeMaterialDetalhe>
                    size='small'
                    rowKey='id'
                    pagination={false}
                    columns={materiaisColumns}
                    dataSource={detalhe.atividadeMateriaisAplicados}
                    locale={{ emptyText: 'Nenhum material aplicado.' }}
                  />
                ),
              },
              {
                key: 'fotos',
                label: `Fotos (${fotosConsolidadas.length})`,
                children: (
                  <Space
                    direction='vertical'
                    style={{ width: '100%' }}
                    size={12}
                  >
                    <Alert
                      type='info'
                      showIcon
                      message='Legenda das fotos'
                      description={
                        <Space direction='vertical' size={4}>
                          {legendaFotos.map(item => (
                            <Space key={item.origem} size={8}>
                              <Tag color={getOrigemColor(item.origem)}>
                                {item.origem}
                              </Tag>
                              <Text>{item.descricao}</Text>
                            </Space>
                          ))}
                        </Space>
                      }
                    />

                    <Table
                      size='small'
                      rowKey='key'
                      pagination={false}
                      dataSource={fotosConsolidadas}
                      locale={{
                        emptyText: 'Nenhuma foto/evidência encontrada.',
                      }}
                      columns={[
                        {
                          title: 'Origem',
                          dataIndex: 'origem',
                          width: 120,
                          render: (origem: string) => (
                            <Tag color={getOrigemColor(origem)}>{origem}</Tag>
                          ),
                        },
                        {
                          title: 'Contexto',
                          dataIndex: 'contexto',
                          width: 260,
                        },
                        { title: 'Arquivo', dataIndex: 'nomeArquivo' },
                        {
                          title: 'Visualização',
                          key: 'preview',
                          width: 160,
                          render: (_, record) =>
                            renderMediaPreview({
                              url: record.url,
                              mimeType: record.mimeTypeRaw,
                              nomeArquivo: record.nomeArquivo,
                              path: record.path,
                              fallbackPath: record.fallbackPath,
                            }),
                        },
                        {
                          title: 'Criado em',
                          dataIndex: 'criadoEm',
                          width: 170,
                          render: (value: Date | string) =>
                            formatDateTime(value),
                        },
                      ]}
                    />
                  </Space>
                ),
              },
              {
                key: 'respostas',
                label: `Respostas (${detalhe.atividadeFormRespostas.length})`,
                children: (
                  <Table<AtividadeFormRespostaDetalhe>
                    size='small'
                    rowKey='id'
                    pagination={false}
                    columns={respostasColumns}
                    dataSource={detalhe.atividadeFormRespostas}
                    locale={{ emptyText: 'Sem respostas para esta atividade.' }}
                  />
                ),
              },
              {
                key: 'apr',
                label: `APR (${detalhe.atividadeAprPreenchidas.length})`,
                children: aprItems.length ? (
                  <Collapse items={aprItems} />
                ) : (
                  <Empty description='Atividade sem APR preenchida.' />
                ),
              },
              {
                key: 'eventos',
                label: `Eventos (${detalhe.atividadeEventos.length})`,
                children: (
                  <Table<AtividadeEventoDetalhe>
                    size='small'
                    rowKey='id'
                    pagination={false}
                    columns={eventosColumns}
                    dataSource={detalhe.atividadeEventos}
                    locale={{ emptyText: 'Sem eventos registrados.' }}
                  />
                ),
              },
            ]}
          />
        </>
      ) : null}
    </Modal>
  );
}
