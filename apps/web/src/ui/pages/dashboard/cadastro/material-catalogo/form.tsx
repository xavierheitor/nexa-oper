'use client';

import { App, Button, Form, Input, Select, Spin, Switch } from 'antd';
import { useEffect } from 'react';

export interface MaterialCatalogoFormData {
  codigo: string;
  descricao: string;
  unidadeMedida: string;
  contratoId: number;
  ativo?: boolean;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string;
}

interface Props {
  onSubmit: (values: MaterialCatalogoFormData) => void;
  initialValues?: Partial<MaterialCatalogoFormData>;
  loading?: boolean;
  contratos: ContratoOption[];
}

export default function MaterialCatalogoForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
}: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<MaterialCatalogoFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.setFieldsValue({ ativo: true });
  }, [initialValues, form]);

  const handleSubmit = (values: MaterialCatalogoFormData) => {
    if (!values.ativo && values.ativo !== false) {
      message.error('Informe se o material está ativo.');
      return;
    }

    onSubmit(values);
  };

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={handleSubmit}>
        <Form.Item
          name='codigo'
          label='Código'
          rules={[
            { required: true, message: 'Código é obrigatório' },
            { min: 1, max: 100, message: 'Código deve ter entre 1 e 100 caracteres' },
          ]}
        >
          <Input autoFocus placeholder='Código do material' maxLength={100} />
        </Form.Item>

        <Form.Item
          name='descricao'
          label='Descrição'
          rules={[
            { required: true, message: 'Descrição é obrigatória' },
            {
              min: 1,
              max: 255,
              message: 'Descrição deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input placeholder='Descrição do material' maxLength={255} />
        </Form.Item>

        <Form.Item
          name='unidadeMedida'
          label='Unidade de Medida'
          rules={[
            { required: true, message: 'Unidade de medida é obrigatória' },
            {
              min: 1,
              max: 30,
              message: 'Unidade de medida deve ter entre 1 e 30 caracteres',
            },
          ]}
        >
          <Input placeholder='Ex.: UN, KG, M, CX' maxLength={30} />
        </Form.Item>

        <Form.Item
          name='contratoId'
          label='Contrato'
          rules={[{ required: true, message: 'Contrato é obrigatório' }]}
        >
          <Select
            placeholder='Selecione o contrato'
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={contratos.map((contrato) => ({
              value: contrato.id,
              label: contrato.numero
                ? `${contrato.nome} (${contrato.numero})`
                : contrato.nome,
            }))}
          />
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
