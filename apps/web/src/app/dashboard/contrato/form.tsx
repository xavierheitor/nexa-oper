'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface ContratoFormData {
  nome: string;
  numero: string;
  dataInicio?: Date | null;
  dataFim?: Date | null;
}

interface ContratoFormProps {
  onSubmit: (values: ContratoFormData) => void;
  initialValues?: Partial<ContratoFormData>;
  loading?: boolean;
}

export default function ContratoForm({
  onSubmit,
  initialValues,
  loading = false,
}: ContratoFormProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  if (loading) return <Spin spinning />;

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Nome do Contrato"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input autoFocus placeholder="Digite o nome do contrato" />
      </Form.Item>

      <Form.Item
        name="numero"
        label="Número do Contrato"
        rules={[
          { required: true, message: 'Número é obrigatório' },
          { min: 1, max: 255, message: 'Número deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input placeholder="Digite o número do contrato" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
