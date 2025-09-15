'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface TipoChecklistFormData { nome: string }

interface Props {
  onSubmit: (values: TipoChecklistFormData) => void;
  initialValues?: Partial<TipoChecklistFormData>;
  loading?: boolean;
}

export default function TipoChecklistForm({ onSubmit, initialValues, loading = false }: Props) {
  const [form] = Form.useForm<TipoChecklistFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

    if (loading) return <Spin spinning />;

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Tipo de Checklist"
        rules={[{ required: true, message: 'Nome é obrigatório' }, { min: 1, max: 255 }]}
      >
        <Input autoFocus placeholder="Digite o nome do tipo" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>Salvar</Button>
      </Form.Item>
    </Form>
  );
}

