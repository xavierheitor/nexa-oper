'use client';

import { Button, Form, Input, Spin } from 'antd';
import { useEffect } from 'react';

export interface ChecklistPerguntaFormData { nome: string }

interface Props {
  onSubmit: (values: ChecklistPerguntaFormData) => void;
  initialValues?: Partial<ChecklistPerguntaFormData>;
  loading?: boolean;
}

export default function ChecklistPerguntaForm({ onSubmit, initialValues, loading = false }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Pergunta"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
        ]}
      >
        <Input autoFocus placeholder="Digite a pergunta" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
    </Spin>
  );
}

