'use client';

import { Button, Form, Input, Select, Spin } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

export interface ProjetoProgramacaoFormData {
  contratoId: number;
  numeroProjeto: string;
  municipio: string;
  equipamento: string;
  observacao?: string;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero: string;
}

interface Props {
  onSubmit: (values: ProjetoProgramacaoFormData) => void | Promise<void>;
  initialValues?: Partial<ProjetoProgramacaoFormData>;
  loading?: boolean;
  contratos: ContratoOption[];
}

export default function ProjetoProgramacaoForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
}: Props) {
  const [form] = Form.useForm<ProjetoProgramacaoFormData>();

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
        layout="vertical"
        onFinish={(values) => {
          void onSubmit(values);
        }}
      >
        <Form.Item
          name="contratoId"
          label="Contrato"
          rules={[{ required: true, message: 'Contrato é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder="Selecione o contrato"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={contratos.map((contrato) => ({
              value: contrato.id,
              label: `${contrato.nome} (${contrato.numero})`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="numeroProjeto"
          label="Número do Projeto"
          rules={[
            { required: true, message: 'Número do projeto é obrigatório' },
            {
              min: 1,
              max: 100,
              message: 'Número do projeto deve ter entre 1 e 100 caracteres',
            },
          ]}
        >
          <Input autoFocus placeholder="Digite o número do projeto" />
        </Form.Item>

        <Form.Item
          name="municipio"
          label="Município"
          rules={[
            { required: true, message: 'Município é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Município deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input placeholder="Digite o município" />
        </Form.Item>

        <Form.Item
          name="equipamento"
          label="Equipamento"
          rules={[
            { required: true, message: 'Equipamento é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Equipamento deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input placeholder="Digite o equipamento" />
        </Form.Item>

        <Form.Item
          name="observacao"
          label="Observações"
          rules={[
            {
              max: 5000,
              message: 'Observações devem ter no máximo 5000 caracteres',
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Digite observações do projeto"
            showCount
            maxLength={5000}
          />
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
