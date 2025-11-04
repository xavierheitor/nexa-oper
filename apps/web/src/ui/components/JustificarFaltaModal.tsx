'use client';

import { Modal, Form, Input, Select, Space, Button } from 'antd';
import { Falta } from '@/lib/schemas/turnoRealizadoSchema';
import { useEffect } from 'react';

const { TextArea } = Input;

interface JustificarFaltaModalProps {
  open: boolean;
  onClose: () => void;
  onJustificar: (data: { faltaId: number; tipoJustificativaId: number; descricao?: string }) => Promise<void>;
  falta: Falta | null;
  loading?: boolean;
  tiposJustificativa?: Array<{ id: number; nome: string }>;
}

/**
 * Modal para justificar uma falta
 *
 * Nota: Este é um modal básico. A implementação completa deve integrar
 * com o sistema de justificativas existente (Justificativa, TipoJustificativa, etc.)
 */
export default function JustificarFaltaModal({
  open,
  onClose,
  onJustificar,
  falta,
  loading = false,
  tiposJustificativa = [],
}: JustificarFaltaModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && falta) {
      form.resetFields();
    }
  }, [open, falta, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!falta) return;

      await onJustificar({
        faltaId: falta.id,
        tipoJustificativaId: values.tipoJustificativaId,
        descricao: values.descricao,
      });

      form.resetFields();
    } catch (error) {
      console.error('Erro ao justificar falta:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={falta ? `Justificar Falta - ${falta.eletricista.nome}` : 'Justificar Falta'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnHidden
      width={600}
    >
      {open && (
        <>
          {falta && (
            <div style={{ marginBottom: 16 }}>
              <p><strong>Data:</strong> {new Date(falta.dataReferencia).toLocaleDateString('pt-BR')}</p>
              <p><strong>Eletricista:</strong> {falta.eletricista.nome} ({falta.eletricista.matricula})</p>
              <p><strong>Equipe:</strong> {falta.equipe.nome}</p>
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
        <Form.Item
          name="tipoJustificativaId"
          label="Tipo de Justificativa"
          rules={[{ required: true, message: 'Selecione um tipo de justificativa' }]}
        >
          <Select
            placeholder="Selecione o tipo"
            options={tiposJustificativa.map((t) => ({
              value: t.id,
              label: t.nome,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="descricao"
          label="Descrição (opcional)"
        >
          <TextArea
            rows={4}
            placeholder="Descreva a justificativa da falta"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Justificar
            </Button>
            <Button onClick={handleCancel}>Cancelar</Button>
          </Space>
        </Form.Item>
      </Form>
        </>
      )}
    </Modal>
  );
}

