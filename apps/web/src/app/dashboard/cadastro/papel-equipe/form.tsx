/**
 * Formulário de Papel de Equipe
 *
 * Componente reutilizável para criação e edição de papéis de equipe
 */

'use client';

import React from 'react';
import { Form, Input, Switch, InputNumber, Button, Space } from 'antd';

interface PapelEquipeFormProps {
  initialValues?: {
    nome?: string;
    ativo?: boolean;
    exigeHabilitacao?: boolean;
    prioridadeEscala?: number;
  };
  onSubmit: (values: unknown) => Promise<void>;
  onCancel: () => void;
}

export default function PapelEquipeForm({
  initialValues,
  onSubmit,
  onCancel,
}: PapelEquipeFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: unknown) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        ativo: true,
        exigeHabilitacao: false,
        ...initialValues,
      }}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="nome"
        label="Nome do Papel"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { max: 255, message: 'Máximo 255 caracteres' },
        ]}
      >
        <Input placeholder="Ex: Líder, Motorista, Montador" />
      </Form.Item>

      <Form.Item
        name="ativo"
        label="Ativo"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="exigeHabilitacao"
        label="Exige Habilitação"
        valuePropName="checked"
        tooltip="Se marcado, apenas eletricistas com habilitação podem assumir este papel"
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="prioridadeEscala"
        label="Prioridade na Escala"
        tooltip="Menor valor = maior prioridade (opcional)"
      >
        <InputNumber
          min={0}
          max={999}
          placeholder="Ex: 1, 2, 3..."
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

