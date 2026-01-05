'use client';

/**
 * Página de Detalhes do Checklist
 *
 * Mostra todas as informações de um checklist preenchido:
 * - Dados do checklist (nome, tipo, data, hora)
 * - Dados do eletricista (nome, matrícula)
 * - Dados do turno (equipe, veículo)
 * - Todas as perguntas e respostas
 * - Fotos (se houver)
 */

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Typography, Tag, Space, Image, Empty, Collapse, Button, Descriptions, Row, Col } from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useDataFetch } from '@/lib/hooks/useDataFetch';
import { getChecklistPreenchidoById } from '@/lib/actions/checklist/getPreenchidoById';
import { buildPhotoUrl, isValidPhotoPath } from '@/lib/utils/photos';

const { Title, Text } = Typography;

interface ChecklistRespostaFoto {
  id: number;
  caminhoArquivo: string;
  urlPublica?: string;
  tamanhoBytes: bigint;
  mimeType: string;
  sincronizadoEm: string;
  createdAt: string;
}

interface ChecklistResposta {
  id: number;
  dataResposta: string | Date;
  aguardandoFoto: boolean;
  fotosSincronizadas: number;
  pergunta: {
    id: number;
    nome: string;
  };
  opcaoResposta: {
    id: number;
    nome: string;
    geraPendencia: boolean;
  };
  ChecklistRespostaFoto: ChecklistRespostaFoto[];
}

interface ChecklistPreenchidoDetalhes {
  id: number;
  uuid: string;
  turnoId: number;
  checklistId: number;
  eletricistaId: number;
  dataPreenchimento: Date | string;
  latitude?: number;
  longitude?: number;
  checklist: {
    id: number;
    nome: string;
    tipoChecklist: {
      id: number;
      nome: string;
    };
  };
  eletricista: {
    id: number;
    nome: string;
    matricula: string;
  };
  turno: {
    id: number;
    equipe: {
      id: number;
      nome: string;
      tipoEquipe: {
        id: number;
        nome: string;
      };
    };
    veiculo: {
      id: number;
      placa: string;
      modelo?: string;
    };
  };
  ChecklistResposta: ChecklistResposta[];
}

export default function ChecklistDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const checklistId = parseInt(id, 10);

  const { data: checklist, loading } = useDataFetch<ChecklistPreenchidoDetalhes>(
    async () => {
      const result = await getChecklistPreenchidoById({ id: checklistId });
      if (result.success && result.data) {
        return result.data;
      }
      throw new Error('Erro ao carregar checklist');
    },
    [checklistId]
  );

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text>Carregando...</Text>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="Checklist não encontrado" />
      </div>
    );
  }

  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const formatFileSize = (bytes: bigint) => {
    const bytesNumber = Number(bytes);
    if (bytesNumber === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytesNumber) / Math.log(k));
    return parseFloat((bytesNumber / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getRespostaStatus = (resposta: ChecklistResposta) => {
    if (resposta.aguardandoFoto) {
      return { color: 'orange', icon: <ExclamationCircleOutlined />, text: 'Aguardando foto' };
    }
    if (resposta.fotosSincronizadas > 0 || (resposta.ChecklistRespostaFoto && resposta.ChecklistRespostaFoto.length > 0)) {
      return { color: 'green', icon: <CheckCircleOutlined />, text: 'Com foto' };
    }
    return { color: 'blue', icon: <CheckCircleOutlined />, text: 'Respondido' };
  };

  const dataPreenchimentoStr = checklist.dataPreenchimento instanceof Date
    ? checklist.dataPreenchimento.toISOString()
    : checklist.dataPreenchimento;
  const { date, time } = formatDateTime(dataPreenchimentoStr);

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16 }}
      >
        Voltar
      </Button>

      <Title level={2}>{checklist.checklist.nome}</Title>

      {/* Informações Gerais */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered>
          <Descriptions.Item label="Tipo de Checklist">
            <Tag color="blue">{checklist.checklist.tipoChecklist.nome}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Data">
            <Space>
              <CalendarOutlined />
              <Text>{date}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Hora">
            <Space>
              <ClockCircleOutlined />
              <Text>{time}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Eletricista">
            <Space>
              <UserOutlined />
              <Text>{checklist.eletricista.nome}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Matrícula">
            <Text>{checklist.eletricista.matricula}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Equipe">
            <Space>
              <TeamOutlined />
              <Text>{checklist.turno.equipe.nome}</Text>
              <Tag>{checklist.turno.equipe.tipoEquipe.nome}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Veículo">
            <Space>
              <CarOutlined />
              <Text strong>{checklist.turno.veiculo.placa}</Text>
              {checklist.turno.veiculo.modelo && (
                <Text type="secondary">({checklist.turno.veiculo.modelo})</Text>
              )}
            </Space>
          </Descriptions.Item>
          {checklist.latitude && checklist.longitude && (
            <Descriptions.Item label="Localização">
              <Text type="secondary">
                📍 {checklist.latitude.toFixed(6)}, {checklist.longitude.toFixed(6)}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Respostas do Checklist */}
      <Card>
        <Title level={4}>Respostas ({checklist.ChecklistResposta.length})</Title>

        {checklist.ChecklistResposta.length === 0 ? (
          <Empty description="Nenhuma resposta encontrada" />
        ) : (
          <Collapse
            items={checklist.ChecklistResposta.map((resposta, index) => {
              const status = getRespostaStatus(resposta);
              const dataRespostaStr = resposta.dataResposta instanceof Date
                ? resposta.dataResposta.toISOString()
                : resposta.dataResposta;
              const { date: respostaDate, time: respostaTime } = formatDateTime(dataRespostaStr);

              return {
                key: resposta.id,
                label: (
                  <Space>
                    <Text strong>{index + 1}. {resposta.pergunta.nome}</Text>
                    <Tag color={status.color} icon={status.icon}>
                      {status.text}
                    </Tag>
                    {resposta.opcaoResposta.geraPendencia && (
                      <Tag color="red">Gera Pendência</Tag>
                    )}
                  </Space>
                ),
                extra: (
                  <Space>
                    <Text type="secondary">{respostaDate} {respostaTime}</Text>
                    {resposta.ChecklistRespostaFoto && resposta.ChecklistRespostaFoto.length > 0 && (
                      <Space>
                        <CameraOutlined />
                        <Text>{resposta.ChecklistRespostaFoto.length}</Text>
                      </Space>
                    )}
                  </Space>
                ),
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    {/* Resposta */}
                    <Card size="small">
                      <Space direction="vertical" size={4}>
                        <Text strong>Resposta:</Text>
                        <Tag color={resposta.opcaoResposta.geraPendencia ? 'red' : 'green'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                          {resposta.opcaoResposta.nome}
                        </Tag>
                        {resposta.opcaoResposta.geraPendencia && (
                          <Text type="warning">
                            ⚠️ Esta resposta gera uma pendência automática
                          </Text>
                        )}
                      </Space>
                    </Card>

                    {/* Fotos */}
                    {resposta.ChecklistRespostaFoto && resposta.ChecklistRespostaFoto.length > 0 && (
                      <Card size="small" title={<><CameraOutlined /> Fotos ({resposta.ChecklistRespostaFoto.length})</>}>
                        <Row gutter={[16, 16]}>
                          {resposta.ChecklistRespostaFoto.map((foto) => {
                            const photoUrl = foto.urlPublica || buildPhotoUrl(foto.caminhoArquivo);

                            return (
                              <Col xs={24} sm={12} md={8} lg={6} key={foto.id}>
                                <Card
                                  size="small"
                                  cover={
                                    isValidPhotoPath(foto.caminhoArquivo) || foto.urlPublica ? (
                                      <Image
                                        src={photoUrl}
                                        alt={`Foto ${foto.id}`}
                                        style={{ objectFit: 'cover', height: 200 }}
                                        preview={{
                                          mask: 'Visualizar',
                                        }}
                                      />
                                    ) : (
                                      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                                        <Text type="secondary">Foto não disponível</Text>
                                      </div>
                                    )
                                  }
                                >
                                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      {new Date(foto.createdAt).toLocaleString('pt-BR')}
                                    </Text>
                                    {foto.tamanhoBytes && (
                                      <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {formatFileSize(foto.tamanhoBytes)}
                                      </Text>
                                    )}
                                  </Space>
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </Card>
                    )}

                    {(!resposta.ChecklistRespostaFoto || resposta.ChecklistRespostaFoto.length === 0) && (
                      <Text type="secondary">Sem fotos associadas</Text>
                    )}
                  </Space>
                ),
              };
            })}
          />
        )}
      </Card>
    </div>
  );
}

