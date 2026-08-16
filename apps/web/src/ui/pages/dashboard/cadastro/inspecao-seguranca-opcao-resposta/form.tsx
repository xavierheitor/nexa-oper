'use client';

import { Button, Form, Input, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface InspecaoSegurancaOpcaoRespostaFormData {
  nome: string;
  geraPendencia?: boolean;
  exigeFoto?: boolean;
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: InspecaoSegurancaOpcaoRespostaFormData) => void;
  initialValues?: Partial<InspecaoSegurancaOpcaoRespostaFormData>;
  loading?: boolean;
}

export default function InspecaoSegurancaOpcaoRespostaForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<InspecaoSegurancaOpcaoRespostaFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else {
      form.resetFields();
      form.setFieldsValue({ geraPendencia: false, exigeFoto: false, ativo: true });
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item name='nome' label='Opção de Resposta' rules={[{ required: true }]}>
          <Input autoFocus maxLength={255} showCount />
        </Form.Item>

        <Form.Item name='geraPendencia' label='Gera pendência' valuePropName='checked'>
          <Switch />
        </Form.Item>

        <Form.Item name='exigeFoto' label='Exige foto quando gerar pendência' valuePropName='checked'>
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
