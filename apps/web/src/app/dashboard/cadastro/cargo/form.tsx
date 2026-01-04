/**
 * Formulário de Cargo
 */

'use client';

import { Button, Form, Input, InputNumber, Space } from 'antd';

export interface CargoFormData {
  nome: string;
  salarioBase?: number;
}

interface CargoFormProps {
  initialValues?: Partial<CargoFormData>;
  onSubmit: (values: CargoFormData) => void;
  loading?: boolean;
}

export default function CargoForm({ initialValues, onSubmit, loading = false }: CargoFormProps) {
  const [form] = Form.useForm();

  return (
    <Form<CargoFormData>
      form={form}
      layout="vertical"
      initialValues={initialValues || { salarioBase: 0 }}
      onFinish={onSubmit}
    >
      <Form.Item
        name="nome"
        label="Nome do Cargo"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { max: 255, message: 'Máximo 255 caracteres' },
        ]}
      >
        <Input placeholder="Ex: Eletricista, Técnico, Auxiliar..." autoFocus />
      </Form.Item>

      <Form.Item
        name="salarioBase"
        label="Salário Base (R$)"
        rules={[
          { required: true, message: 'Salário base é obrigatório' },
        ]}
        tooltip="Valor base de referência para este cargo"
      >
        <InputNumber
          min={0}
          step={100}
          placeholder="0,00"
          style={{ width: '100%' }}
          formatter={(value) => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
          parser={(value) => value?.replace(/R\$\s?|(\.*)/g, '') as any}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

