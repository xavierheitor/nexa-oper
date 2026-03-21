'use client';

import type { ProjTipoMotivoOcorrencia } from '@nexa-oper/db';
import { Button, Form, Input, Select, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface ProjMotivoOcorrenciaFormData {
  codigo: string;
  descricao: string;
  tipo: ProjTipoMotivoOcorrencia;
  ativo?: boolean;
}

interface Props {
  onSubmit: (values: ProjMotivoOcorrenciaFormData) => void;
  initialValues?: Partial<ProjMotivoOcorrenciaFormData>;
  loading?: boolean;
}

const TIPO_OPTIONS = [
  {
    value: 'CANCELAMENTO_PROGRAMACAO' as ProjTipoMotivoOcorrencia,
    label: 'Cancelamento de Programação',
  },
  {
    value: 'NAO_EXECUCAO_ITEM' as ProjTipoMotivoOcorrencia,
    label: 'Não Execução de Item',
  },
];

export default function ProjMotivoOcorrenciaForm({
  onSubmit,
  initialValues,
  loading = false,
}: Props) {
  const [form] = Form.useForm<ProjMotivoOcorrenciaFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.setFieldsValue({ ativo: true });
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
        <Form.Item
          name='codigo'
          label='Código'
          rules={[
            { required: true, message: 'Código é obrigatório' },
            { min: 1, max: 100, message: 'Código deve ter entre 1 e 100 caracteres' },
          ]}
        >
          <Input autoFocus maxLength={100} placeholder='Código do motivo' />
        </Form.Item>

        <Form.Item
          name='descricao'
          label='Descrição'
          rules={[
            { required: true, message: 'Descrição é obrigatória' },
            { min: 1, max: 255, message: 'Descrição deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input maxLength={255} placeholder='Descrição do motivo' />
        </Form.Item>

        <Form.Item
          name='tipo'
          label='Tipo'
          rules={[{ required: true, message: 'Tipo é obrigatório' }]}
        >
          <Select options={TIPO_OPTIONS} placeholder='Selecione o tipo' />
        </Form.Item>

        <Form.Item name='ativo' label='Ativo' valuePropName='checked'>
          <Switch />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit' block loading={loading}>
            Salvar
          </Button>
        </Form.Item>
      </Form>
    </Spin>
  );
}
