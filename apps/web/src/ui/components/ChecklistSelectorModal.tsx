'use client';

/**
 * Modal de Seleção de Checklist
 *
 * Primeira etapa do visualizador de checklists.
 * Permite ao usuário selecionar qual checklist específico deseja visualizar
 * de todos os checklists preenchidos em um turno.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, List, Card, Typography, Spin, Empty, Tag, Space, Button } from 'antd';
import { EyeOutlined, UserOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getChecklistsByTurno } from '@/lib/actions/checklist/getByTurno';

const { Text } = Typography;

export interface ChecklistPreenchido {
  id: number;
  dataPreenchimento: Date | string;
  latitude?: number | null;
  longitude?: number | null;
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
  ChecklistResposta: Array<{
    id: number;
    dataResposta: Date | string;
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
  }>;
}

interface ChecklistSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  turnoId: number;
  turnoInfo: {
    veiculoPlaca: string;
    equipeNome: string;
    dataInicio: string;
  };
  onSelectChecklist: (checklist: ChecklistPreenchido) => void;
}

export default function ChecklistSelectorModal({
  visible,
  onClose,
  turnoId,
  turnoInfo,
  onSelectChecklist,
}: ChecklistSelectorModalProps) {
  const [checklists, setChecklists] = useState<ChecklistPreenchido[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChecklists = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getChecklistsByTurno({ turnoId });

      if (result.success && result.data) {
        setChecklists(result.data);
      } else {
        console.error('Erro ao buscar checklists:', result.error);
        setChecklists([]);
      }
    } catch (error) {
      console.error('Erro ao buscar checklists:', error);
      setChecklists([]);
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    if (visible && turnoId) {
      fetchChecklists();
    }
  }, [visible, turnoId, fetchChecklists]);

  const handleSelectChecklist = (checklist: ChecklistPreenchido) => {
    onSelectChecklist(checklist);
    onClose();
  };

  const formatDateTime = (dateInput: Date | string) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getStatusColor = (checklist: ChecklistPreenchido) => {
    const totalRespostas = checklist.ChecklistResposta.length;
    const respostasComFoto = checklist.ChecklistResposta.filter(r => r.fotosSincronizadas > 0).length;
    const aguardandoFoto = checklist.ChecklistResposta.some(r => r.aguardandoFoto);

    if (aguardandoFoto) return 'orange';
    if (respostasComFoto === totalRespostas && totalRespostas > 0) return 'green';
    return 'blue';
  };

  const getStatusText = (checklist: ChecklistPreenchido) => {
    const totalRespostas = checklist.ChecklistResposta.length;
    const respostasComFoto = checklist.ChecklistResposta.filter(r => r.fotosSincronizadas > 0).length;
    const aguardandoFoto = checklist.ChecklistResposta.some(r => r.aguardandoFoto);

    if (aguardandoFoto) return 'Aguardando fotos';
    if (respostasComFoto === totalRespostas && totalRespostas > 0) return 'Completo';
    return 'Preenchido';
  };

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>Selecionar Checklist - Turno {turnoInfo.veiculoPlaca}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <Space direction="vertical" size={4}>
            <Text strong>Veículo: {turnoInfo.veiculoPlaca}</Text>
            <Text>Equipe: {turnoInfo.equipeNome}</Text>
            <Text>
              <CalendarOutlined /> {formatDateTime(turnoInfo.dataInicio).date} às {formatDateTime(turnoInfo.dataInicio).time}
            </Text>
          </Space>
        </Card>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Carregando checklists...</Text>
          </div>
        </div>
      ) : checklists.length === 0 ? (
        <Empty description="Nenhum checklist encontrado para este turno" />
      ) : (
        <List
          dataSource={checklists}
          renderItem={(checklist) => {
            const { date, time } = formatDateTime(checklist.dataPreenchimento);

            return (
              <List.Item
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleSelectChecklist(checklist)}
                  >
                    Visualizar
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{checklist.checklist.nome}</Text>
                      <Tag color={getStatusColor(checklist)}>
                        {getStatusText(checklist)}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      <Space>
                        <UserOutlined />
                        <Text>{checklist.eletricista.nome} ({checklist.eletricista.matricula})</Text>
                      </Space>
                      <Space>
                        <ClockCircleOutlined />
                        <Text>{date} às {time}</Text>
                      </Space>
                      <Text type="secondary">
                        Tipo: {checklist.checklist.tipoChecklist.nome}
                      </Text>
                      <Text type="secondary">
                        {checklist.ChecklistResposta.length} resposta(s) |
                        {checklist.ChecklistResposta.filter(r => r.fotosSincronizadas > 0).length} com foto(s)
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Modal>
  );
}
