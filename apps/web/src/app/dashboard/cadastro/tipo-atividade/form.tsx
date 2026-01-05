'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface TipoAtividadeFormData { nome: string }

interface Props {
  onSubmit: (values: TipoAtividadeFormData) => void;
  initialValues?: Partial<TipoAtividadeFormData>;
  loading?: boolean;
}

export default function TipoAtividadeForm({ onSubmit, initialValues, loading = false }: Props) {
  const [form] = Form.useForm<TipoAtividadeFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Tipo de Atividade"
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

