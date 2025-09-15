'use client';

import { Button, Form, Input, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface ChecklistOpcaoRespostaFormData {
  nome: string;
  geraPendencia?: boolean;
}

interface Props {
  onSubmit: (values: ChecklistOpcaoRespostaFormData) => void;
  initialValues?: Partial<ChecklistOpcaoRespostaFormData>;
  loading?: boolean;
}

export default function ChecklistOpcaoRespostaForm({ onSubmit, initialValues, loading = false }: Props) {
  const [form] = Form.useForm<ChecklistOpcaoRespostaFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else form.resetFields();
  }, [initialValues, form]);

  if (loading) return <Spin spinning />;

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Opção de Resposta"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
        ]}
      >
        <Input autoFocus placeholder="Digite a opção de resposta" />
      </Form.Item>

      <Form.Item name="geraPendencia" label="Gera Pendência" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}

