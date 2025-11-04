'use client';

import { Modal, Form, Input, Radio, Space, Button } from 'antd';
import { HoraExtra, AcaoAprovacao } from '@/lib/schemas/turnoRealizadoSchema';

const { TextArea } = Input;

interface AprovarHoraExtraModalProps {
  open: boolean;
  onClose: () => void;
  onAprovar?: (data: { id: number; acao: AcaoAprovacao; observacoes?: string }) => Promise<void>;
  horaExtra: HoraExtra | null;
  loading?: boolean;
}

/**
 * Modal para aprovar ou rejeitar hora extra
 */
export default function AprovarHoraExtraModal({
  open,
  onClose,
  onAprovar,
  horaExtra,
  loading = false,
}: AprovarHoraExtraModalProps) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!horaExtra || !onAprovar) return;

      await onAprovar({
        id: horaExtra.id,
        acao: values.acao,
        observacoes: values.observacoes,
      });

      form.resetFields();
    } catch (error) {
      console.error('Erro ao aprovar hora extra:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={horaExtra ? `Aprovar/Rejeitar Hora Extra - ${horaExtra.eletricista.nome}` : 'Aprovar Hora Extra'}
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
      width={600}
    >
      {horaExtra && (
        <div style={{ marginBottom: 16 }}>
          <p><strong>Data:</strong> {new Date(horaExtra.dataReferencia).toLocaleDateString('pt-BR')}</p>
          <p><strong>Tipo:</strong> {horaExtra.tipo}</p>
          <p><strong>Horas:</strong> {horaExtra.horasRealizadas.toFixed(1)}h</p>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ acao: 'aprovar' }}
      >
        <Form.Item
          name="acao"
          label="Ação"
          rules={[{ required: true, message: 'Selecione uma ação' }]}
        >
          <Radio.Group>
            <Radio value="aprovar">Aprovar</Radio>
            <Radio value="rejeitar">Rejeitar</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="observacoes"
          label="Observações (opcional)"
        >
          <TextArea
            rows={4}
            placeholder="Adicione observações sobre a aprovação/rejeição"
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              Confirmar
            </Button>
            <Button onClick={handleCancel}>Cancelar</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

