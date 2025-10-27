'use client';

/**
 * Modal de Visualização de Checklist
 *
 * Segunda etapa do visualizador de checklists.
 * Mostra o checklist específico selecionado com todas as suas respostas e fotos.
 */

import React, { useState } from 'react';
import { Modal, Card, Typography, List, Tag, Space, Image, Empty, Collapse, Divider, Alert } from 'antd';
import { EyeOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined, CameraOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface ChecklistResposta {
  id: number;
  dataResposta: string;
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
  ChecklistRespostaFoto: Array<{
    id: number;
    caminhoArquivo: string;
    urlPublica?: string;
    tamanhoBytes: bigint;
    mimeType: string;
    sincronizadoEm: string;
    createdAt: string;
  }>;
}

interface ChecklistPreenchido {
  id: number;
  dataPreenchimento: string;
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
  ChecklistResposta: ChecklistResposta[];
}

interface ChecklistViewerModalProps {
  visible: boolean;
  onClose: () => void;
  checklist: ChecklistPreenchido | null;
}

export default function ChecklistViewerModal({
  visible,
  onClose,
  checklist,
}: ChecklistViewerModalProps) {
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  if (!checklist) return null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
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
    if (resposta.fotosSincronizadas > 0) {
      return { color: 'green', icon: <CheckCircleOutlined />, text: 'Com foto' };
    }
    return { color: 'blue', icon: <CheckCircleOutlined />, text: 'Respondido' };
  };

  const handleImagePreview = (imagePath: string) => {
    setPreviewImage(imagePath);
    setImagePreviewVisible(true);
  };

  const { date, time } = formatDateTime(checklist.dataPreenchimento);

  return (
    <>
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>{checklist.checklist.nome}</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        {/* Informações do Checklist */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={8}>
            <Space>
              <Text strong>Tipo: </Text>
              <Tag color="blue">{checklist.checklist.tipoChecklist.nome}</Tag>
            </Space>
            <Space>
              <UserOutlined />
              <Text>{checklist.eletricista.nome} ({checklist.eletricista.matricula})</Text>
            </Space>
            <Space>
              <ClockCircleOutlined />
              <Text>{date} às {time}</Text>
            </Space>
            {checklist.latitude && checklist.longitude && (
              <Space>
                <Text type="secondary">
                  📍 {checklist.latitude.toFixed(6)}, {checklist.longitude.toFixed(6)}
                </Text>
              </Space>
            )}
          </Space>
        </Card>

        {/* Respostas do Checklist */}
        <Title level={4}>Respostas ({checklist.ChecklistResposta.length})</Title>

        {checklist.ChecklistResposta.length === 0 ? (
          <Empty description="Nenhuma resposta encontrada" />
        ) : (
          <Collapse
            items={checklist.ChecklistResposta.map((resposta, index) => {
              const status = getRespostaStatus(resposta);
              const { date: respostaDate, time: respostaTime } = formatDateTime(resposta.dataResposta);

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
                    {resposta.ChecklistRespostaFoto.length > 0 && (
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
                        <Tag color={resposta.opcaoResposta.geraPendencia ? 'red' : 'green'}>
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
                    {resposta.ChecklistRespostaFoto.length > 0 && (
                      <>
                        <Divider orientation="left">
                          <Space>
                            <CameraOutlined />
                            <Text strong>Fotos ({resposta.ChecklistRespostaFoto.length})</Text>
                          </Space>
                        </Divider>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          {resposta.ChecklistRespostaFoto.map((foto) => (
                            <Card
                              key={foto.id}
                              size="small"
                              hoverable
                              onClick={() => handleImagePreview(foto.urlPublica || foto.caminhoArquivo)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div style={{ textAlign: 'center' }}>
                                <Image
                                  src={foto.urlPublica || foto.caminhoArquivo}
                                  alt={`Foto ${foto.id}`}
                                  style={{ width: '100%', height: 120, objectFit: 'cover' }}
                                  preview={false}
                                />
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Foto {foto.id}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: 10 }}>
                                    {formatFileSize(foto.tamanhoBytes)} • {foto.mimeType}
                                  </Text>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </>
                    )}

                    {resposta.ChecklistRespostaFoto.length === 0 && resposta.aguardandoFoto && (
                      <Card size="small" style={{ backgroundColor: '#fff7e6' }}>
                        <Space>
                          <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
                          <Text type="warning">
                            Esta resposta está aguardando o envio de fotos pelo aplicativo móvel.
                          </Text>
                        </Space>
                      </Card>
                    )}
                  </Space>
                ),
              };
            })}
          />
        )}
      </Modal>

      {/* Preview de Imagem */}
      <Image
        style={{ display: 'none' }}
        src={previewImage}
        preview={{
          visible: imagePreviewVisible,
          onVisibleChange: setImagePreviewVisible,
        }}
      />
    </>
  );
}
