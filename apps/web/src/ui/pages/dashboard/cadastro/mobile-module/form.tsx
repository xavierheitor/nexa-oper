'use client';

import type { MobileModuleFormData } from '@/lib/schemas/mobileModuleSchema';
import { Button, Form, Input, InputNumber, Spin, Switch } from 'antd';
import { useEffect } from 'react';

interface Props {
  onSubmit: (values: MobileModuleFormData) => void;
  initialValues?: Partial<MobileModuleFormData>;
  loading?: boolean;
}

export default function MobileModuleForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<MobileModuleFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.setFieldsValue({ ativo: true, ordem: 0 });
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item
          name='nome'
          label='Nome'
          rules={[{ required: true, message: 'Informe o nome do módulo.' }]}
        >
          <Input autoFocus maxLength={255} placeholder='Ex.: Turno' />
        </Form.Item>
        <Form.Item
          name='key'
          label='Chave do mobile'
          extra='Identificador estável usado pelo app. Não reutilize uma chave para outro módulo.'
          rules={[
            { required: true, message: 'Informe a chave do módulo.' },
            {
              pattern: /^mobile\.[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
              message: 'Use o formato mobile.turno.access.',
            },
          ]}
        >
          <Input maxLength={100} placeholder='mobile.turno.access' />
        </Form.Item>
        <Form.Item name='descricao' label='Descrição'>
          <Input.TextArea maxLength={500} rows={3} />
        </Form.Item>
        <Form.Item name='ordem' label='Ordem' initialValue={0}>
          <InputNumber min={0} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name='ativo'
          label='Ativo'
          valuePropName='checked'
          initialValue
        >
          <Switch />
        </Form.Item>
        <Button type='primary' htmlType='submit' block loading={loading}>
          Salvar
        </Button>
      </Form>
    </Spin>
  );
}
