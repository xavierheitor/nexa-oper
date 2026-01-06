'use client';

/**
 * Modal de Visualização de Checklist
 *
 * Segunda etapa do visualizador de checklists.
 * Mostra o checklist específico selecionado com todas as suas respostas e fotos.
 */

import React, { useState } from 'react';
import { Modal, Card, Typography, Tag, Space, Image, Empty, Collapse, Divider } from 'antd';
import { EyeOutlined, UserOutlined, ClockCircleOutlined, CameraOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { buildPhotoUrl, isValidPhotoPath } from '@/lib/utils/photos';
import type { ChecklistPreenchido as ChecklistPreenchidoBase } from './ChecklistSelectorModal';

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

type ChecklistPreenchido = Omit<ChecklistPreenchidoBase, 'ChecklistResposta'> & {
  ChecklistResposta: Array<ChecklistPreenchidoBase['ChecklistResposta'][0] & {
    ChecklistRespostaFoto?: ChecklistRespostaFoto[];
  }>;
};

interface ChecklistViewerModalProps {
  visible: boolean;
  onClose: () => void;
  checklist: ChecklistPreenchido | ChecklistPreenchidoBase | null;
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

  const dataPreenchimentoStr = checklist.dataPreenchimento instanceof Date
    ? checklist.dataPreenchimento.toISOString()
    : checklist.dataPreenchimento;
  const { date, time } = formatDateTime(dataPreenchimentoStr);

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
              const respostaWithFoto = resposta as ChecklistResposta;
              const status = getRespostaStatus(respostaWithFoto);
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
                    {respostaWithFoto.ChecklistRespostaFoto && respostaWithFoto.ChecklistRespostaFoto.length > 0 && (
                      <Space>
                        <CameraOutlined />
                        <Text>{respostaWithFoto.ChecklistRespostaFoto.length}</Text>
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
                    {respostaWithFoto.ChecklistRespostaFoto && respostaWithFoto.ChecklistRespostaFoto.length > 0 && (
                      <>
                        <Divider orientation="left">
                          <Space>
                            <CameraOutlined />
                            <Text strong>Fotos ({respostaWithFoto.ChecklistRespostaFoto.length})</Text>
                          </Space>
                        </Divider>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                          {respostaWithFoto.ChecklistRespostaFoto.map((foto: ChecklistRespostaFoto) => {
                            // Montar URL completa usando utilitário helper
                            const imageSrc = buildPhotoUrl(foto.urlPublica, foto.caminhoArquivo);
                            const hasValidSrc = isValidPhotoPath(imageSrc);

                            return (
                              <Card
                                key={foto.id}
                                size="small"
                                hoverable={hasValidSrc}
                                onClick={() => hasValidSrc && handleImagePreview(imageSrc)}
                                style={{ cursor: hasValidSrc ? 'pointer' : 'default' }}
                              >
                                <div style={{ textAlign: 'center' }}>
                                  {hasValidSrc ? (
                                    <Image
                                      src={imageSrc}
                                      alt={`Foto ${foto.id}`}
                                      style={{ width: '100%', height: 120, objectFit: 'cover' }}
                                      preview={false}
                                    />
                                  ) : (
                                    <div style={{
                                      width: '100%',
                                      height: 120,
                                      backgroundColor: '#f5f5f5',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '1px dashed #d9d9d9'
                                    }}>
                                      <Text type="secondary">URL não disponível</Text>
                                    </div>
                                  )}
                                  <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Foto {foto.id}
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                      {formatFileSize(foto.tamanhoBytes)} • {foto.mimeType}
                                    </Text>
                                    {!hasValidSrc && (
                                      <>
                                        <br />
                                        <Text type="danger" style={{ fontSize: 10 }}>
                                          URL: {imageSrc || 'vazio'}
                                        </Text>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {(!respostaWithFoto.ChecklistRespostaFoto || respostaWithFoto.ChecklistRespostaFoto.length === 0) && resposta.aguardandoFoto && (
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
      {previewImage && previewImage.trim() !== '' && (
        <Image
          style={{ display: 'none' }}
          src={previewImage}
          alt=""
          preview={{
            visible: imagePreviewVisible,
            onVisibleChange: setImagePreviewVisible,
          }}
        />
      )}
    </>
  );
}
