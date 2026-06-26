'use client';

import { Button, Form, Input, Select, Spin } from 'antd';
import { useEffect } from 'react';

export interface ProjProgramaFormData {
  contratoId: number;
  nome: string;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string | null;
}

interface Props {
  onSubmit: (values: ProjProgramaFormData) => void | Promise<void>;
  initialValues?: Partial<ProjProgramaFormData>;
  loading?: boolean;
  contratos: ContratoOption[];
}

export default function ProjProgramaForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
}: Props) {
  const [form] = Form.useForm<ProjProgramaFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.resetFields();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form
        form={form}
        layout='vertical'
        onFinish={(values) => {
          void onSubmit(values);
        }}
      >
        <Form.Item
          name='contratoId'
          label='Contrato'
          rules={[{ required: true, message: 'Contrato é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder='Selecione o contrato'
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

        <Form.Item
          name='nome'
          label='Nome do Programa'
          rules={[
            { required: true, message: 'Nome é obrigatório' },
            { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
          ]}
        >
          <Input autoFocus placeholder='Digite o nome do programa' />
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
