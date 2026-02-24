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

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Tipo de Checklist"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' }
        ]}
      >
        <Input autoFocus placeholder="Digite o nome do tipo" maxLength={255} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>Salvar</Button>
      </Form.Item>
    </Form>
    </Spin>
  );
}

