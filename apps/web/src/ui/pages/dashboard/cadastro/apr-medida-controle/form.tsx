'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface AprMedidaControleFormData {
  nome: string;
}

interface Props {
  onSubmit: (values: AprMedidaControleFormData) => void;
  initialValues?: Partial<AprMedidaControleFormData>;
  loading?: boolean;
}

export default function AprMedidaControleForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<AprMedidaControleFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  if (loading) {
    return <Spin spinning />;
  }

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Medida de Controle"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          {
            min: 1,
            max: 255,
            message: 'Nome deve ter entre 1 e 255 caracteres',
          },
        ]}
      >
        <Input
          autoFocus
          placeholder="Digite a medida de controle"
          showCount
          maxLength={255}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
