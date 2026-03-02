'use client';

import { Button, Form, Input, Space, Switch } from 'antd';
import { useEffect } from 'react';

export interface CausaImprodutivaFormData {
  causa: string;
  ativo?: boolean;
}

interface CausaImprodutivaFormProps {
  onSubmit: (values: CausaImprodutivaFormData) => Promise<void>;
  initialValues?: Partial<CausaImprodutivaFormData>;
  loading?: boolean;
}

export default function CausaImprodutivaForm({
  onSubmit,
  initialValues,
  loading = false,
}: CausaImprodutivaFormProps) {
  const [form] = Form.useForm<CausaImprodutivaFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ativo: true,
        ...initialValues,
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ ativo: true });
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout='vertical'
      onFinish={onSubmit}
      initialValues={{
        ativo: true,
        ...initialValues,
      }}
    >
      <Form.Item
        name='causa'
        label='Causa'
        rules={[
          { required: true, message: 'Causa é obrigatória' },
          { max: 255, message: 'Causa deve ter no máximo 255 caracteres' },
        ]}
      >
        <Input placeholder='Ex: Aguardando liberação de acesso' autoFocus />
      </Form.Item>

      <Form.Item name='ativo' label='Ativo' valuePropName='checked'>
        <Switch checkedChildren='Ativo' unCheckedChildren='Inativo' />
      </Form.Item>

      <Form.Item>
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={() => form.resetFields()}>Limpar</Button>
          <Button type='primary' htmlType='submit' loading={loading}>
            Salvar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
