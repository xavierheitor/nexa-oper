'use client';

/**
 * Modal para Fechar Turno
 *
 * Permite fechar um turno definindo data/hora de fechamento e KM final.
 * Mostra o último KM registrado ou o KM de abertura como referência.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, DatePicker, message, Typography, Space, Alert } from 'antd';
import { fecharTurno } from '@/lib/actions/turno/fechar';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

const { Text } = Typography;

interface TurnoData {
  id: number;
  kmInicio: number;
  kmFim?: number;
  dataInicio: string;
  dataFim?: string;
  veiculoPlaca: string;
  equipeNome: string;
}

interface FecharTurnoModalProps {
  visible: boolean;
  onClose: () => void;
  turno: TurnoData | null;
  onSuccess?: () => void;
}

export default function FecharTurnoModal({
  visible,
  onClose,
  turno,
  onSuccess,
}: FecharTurnoModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Calcular KM de referência (último KM ou KM de abertura)
  const kmReferencia = turno?.kmFim || turno?.kmInicio || 0;

  useEffect(() => {
    if (visible && turno) {
      // Resetar formulário e definir valores padrão
      form.resetFields();
      form.setFieldsValue({
        dataFim: dayjs(),
        kmFim: kmReferencia,
      });
    }
  }, [visible, turno, form, kmReferencia]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const result = await fecharTurno({
        turnoId: turno!.id,
        dataFim: values.dataFim.toISOString(),
        kmFim: values.kmFim,
      });

      if (result.success) {
        message.success('Turno fechado com sucesso!');
        form.resetFields();
        onSuccess?.();
        onClose();
      } else {
        message.error(result.error || 'Erro ao fechar turno');
      }
    } catch (error: any) {
      console.error('Erro ao fechar turno:', error);
      message.error(error.message || 'Erro ao fechar turno');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  if (!turno) {
    return null;
  }

  return (
    <Modal
      title="Fechar Turno"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Fechar Turno"
      cancelText="Cancelar"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          dataFim: dayjs(),
          kmFim: kmReferencia,
        }}
      >
        {/* Informações do turno */}
        <Space direction="vertical" size="small" style={{ marginBottom: 16 }}>
          <Text strong>Veículo:</Text> <Text>{turno.veiculoPlaca}</Text>
          <br />
          <Text strong>Equipe:</Text> <Text>{turno.equipeNome}</Text>
        </Space>

        {/* Alerta com KM de referência */}
        <Alert
          message={`KM de Referência: ${kmReferencia.toLocaleString('pt-BR')}`}
          description={
            turno.kmFim
              ? 'Último KM registrado no sistema'
              : 'KM de abertura do turno'
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* Data/Hora de Fechamento */}
        <Form.Item
          label="Data/Hora de Fechamento"
          name="dataFim"
          rules={[
            { required: true, message: 'Por favor, informe a data/hora de fechamento' },
          ]}
        >
          <DatePicker
            showTime
            format="DD/MM/YYYY HH:mm"
            style={{ width: '100%' }}
            placeholder="Selecione a data e hora de fechamento"
            disabledDate={(current) => {
              // Não permitir datas anteriores à data de início
              if (!turno.dataInicio) return false;
              return current && current.isBefore(dayjs(turno.dataInicio), 'day');
            }}
          />
        </Form.Item>

        {/* KM Final */}
        <Form.Item
          label="KM Final"
          name="kmFim"
          rules={[
            { required: true, message: 'Por favor, informe o KM final' },
            {
              type: 'number',
              min: turno.kmInicio,
              message: `KM final deve ser maior ou igual ao KM de abertura (${turno.kmInicio.toLocaleString('pt-BR')})`,
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="Informe o KM final"
            min={turno.kmInicio}
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
            parser={(value) => {
              const parsed = value!.replace(/\s?\./g, '');
              return parsed ? Number(parsed) : 0;
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

