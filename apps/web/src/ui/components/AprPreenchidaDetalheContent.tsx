'use client';

import type {
  AtividadeAprAssinaturaDetalhe,
  AtividadeAprPreenchidaDetalhe,
  AtividadeUploadEvidenceDetalhe,
} from '@/lib/types/atividadeDashboard';
import { buildPhotoUrl } from '@/lib/utils/photos';
import AprRespostasAgrupadas from '@/ui/components/AprRespostasAgrupadas';
import {
  Card,
  Descriptions,
  Image,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const { Paragraph } = Typography;

function formatDateTime(value?: Date | string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function formatCoords(latitude?: number | null, longitude?: number | null) {
  if (latitude == null || longitude == null) return '-';
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function isImageMimeType(mimeType?: string | null) {
  return Boolean(mimeType?.toLowerCase().startsWith('image/'));
}

function renderMediaPreview(input: {
  url?: string | null;
  mimeType?: string | null;
  nomeArquivo?: string | null;
  path?: string | null;
}) {
  const mediaUrl = buildPhotoUrl(input.url || undefined, input.path || undefined);
  if (!mediaUrl) return '-';

  if (isImageMimeType(input.mimeType)) {
    return (
      <Image
        width={96}
        height={96}
        src={mediaUrl}
        alt={input.nomeArquivo || 'Evidência'}
        style={{ objectFit: 'cover' }}
      />
    );
  }

  return (
    <a href={mediaUrl} target='_blank' rel='noopener noreferrer'>
      Abrir arquivo
    </a>
  );
}

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

interface AprPreenchidaDetalheContentProps {
  apr: AtividadeAprPreenchidaDetalhe;
}

export default function AprPreenchidaDetalheContent({
  apr,
}: AprPreenchidaDetalheContentProps) {
  return (
    <Space direction='vertical' style={{ width: '100%' }} size={12}>
      <Descriptions size='small' column={2} bordered>
        <Descriptions.Item label='Preenchida em'>
          {formatDateTime(apr.preenchidaEm)}
        </Descriptions.Item>
        <Descriptions.Item label='Vinculada ao Serviço'>
          {apr.vinculadaAoServico ? (
            <Tag color='green'>Sim</Tag>
          ) : (
            <Tag color='orange'>Não</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label='Início do preenchimento'>
          {formatDateTime(apr.iniciadaEm)}
        </Descriptions.Item>
        <Descriptions.Item label='Coordenadas início'>
          {formatCoords(apr.latitudeInicio, apr.longitudeInicio)}
        </Descriptions.Item>
        <Descriptions.Item label='Coordenadas fim'>
          {formatCoords(apr.latitude, apr.longitude)}
        </Descriptions.Item>
        <Descriptions.Item label='UUID'>{apr.aprUuid}</Descriptions.Item>
      </Descriptions>

      <Card size='small' title='Observações'>
        <Paragraph style={{ marginBottom: 0 }}>
          {apr.observacoes || 'Sem observações'}
        </Paragraph>
      </Card>

      <Card size='small' title={`Respostas (${apr.respostas.length})`}>
        <AprRespostasAgrupadas respostas={apr.respostas} />
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

      <Card size='small' title={`Evidências (${apr.evidenciasUpload.length})`}>
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
  );
}
