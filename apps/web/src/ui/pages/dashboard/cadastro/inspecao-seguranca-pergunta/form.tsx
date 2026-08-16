'use client';

import { Button, Form, Input, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface InspecaoSegurancaPerguntaFormData {
  nome: string;
  obrigatoria?: boolean;
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: InspecaoSegurancaPerguntaFormData) => void;
  initialValues?: Partial<InspecaoSegurancaPerguntaFormData>;
  loading?: boolean;
}

export default function InspecaoSegurancaPerguntaForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<InspecaoSegurancaPerguntaFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else {
      form.resetFields();
      form.setFieldsValue({ obrigatoria: true, ativo: true });
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item name='nome' label='Pergunta' rules={[{ required: true }]}>
          <Input autoFocus maxLength={255} showCount />
        </Form.Item>

        <Form.Item name='obrigatoria' label='Obrigatória' valuePropName='checked'>
          <Switch />
        </Form.Item>

        <Form.Item name='ativo' label='Ativa' valuePropName='checked'>
          <Switch />
        </Form.Item>

        <Button type='primary' htmlType='submit' block loading={loading}>
          Salvar
        </Button>
      </Form>
    </Spin>
  );
}
