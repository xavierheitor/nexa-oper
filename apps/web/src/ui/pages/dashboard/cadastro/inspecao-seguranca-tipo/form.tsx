'use client';

import { Button, Form, Input, Select, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface InspecaoSegurancaTipoFormData {
  nome: string;
  chave: string;
  contexto: 'GERAL' | 'COLABORADOR' | 'EPC' | 'VEICULO';
  descricao?: string | null;
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: InspecaoSegurancaTipoFormData) => void;
  initialValues?: Partial<InspecaoSegurancaTipoFormData>;
  loading?: boolean;
}

export default function InspecaoSegurancaTipoForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<InspecaoSegurancaTipoFormData>();

  useEffect(() => {
    if (initialValues) form.setFieldsValue(initialValues);
    else {
      form.resetFields();
      form.setFieldsValue({ contexto: 'GERAL', ativo: true });
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item name='nome' label='Tipo de Inspeção' rules={[{ required: true }]}>
          <Input autoFocus maxLength={255} showCount />
        </Form.Item>

        <Form.Item name='chave' label='Chave' rules={[{ required: true }]}>
          <Input maxLength={100} placeholder='ex: epi, epc, veicular' />
        </Form.Item>

        <Form.Item name='contexto' label='Contexto' rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'GERAL', label: 'Geral' },
              { value: 'COLABORADOR', label: 'Colaborador' },
              { value: 'EPC', label: 'EPC' },
              { value: 'VEICULO', label: 'Veículo' },
            ]}
          />
        </Form.Item>

        <Form.Item name='descricao' label='Descrição'>
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>

        <Form.Item name='ativo' label='Ativo' valuePropName='checked'>
          <Switch />
        </Form.Item>

        <Button type='primary' htmlType='submit' block loading={loading}>
          Salvar
        </Button>
      </Form>
    </Spin>
  );
}
