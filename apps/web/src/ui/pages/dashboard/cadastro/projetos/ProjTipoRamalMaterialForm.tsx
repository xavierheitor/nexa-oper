'use client';

import type { ProjTipoConsumoMaterial } from '@nexa-oper/db';
import { Button, Form, InputNumber, Select, Spin } from 'antd';
import { useEffect } from 'react';

export interface ProjTipoRamalMaterialFormData {
  contratoId: number;
  tipoRamalId: number;
  materialId: number;
  quantidadeBase: number;
  tipoConsumo: ProjTipoConsumoMaterial;
}

interface ContratoOption {
  id: number;
  nome: string;
  numero?: string | null;
}

interface TipoRamalOption {
  id: number;
  nome: string;
}

interface MaterialOption {
  id: number;
  codigo: string;
  descricao: string;
}

interface Props {
  onSubmit: (values: ProjTipoRamalMaterialFormData) => void;
  initialValues?: Partial<ProjTipoRamalMaterialFormData>;
  loading?: boolean;
  contratos: ContratoOption[];
  tiposRamal: TipoRamalOption[];
  materiais: MaterialOption[];
}

const TIPO_CONSUMO_OPTIONS = [
  { value: 'FIXO' as ProjTipoConsumoMaterial, label: 'Fixo' },
  { value: 'VARIAVEL' as ProjTipoConsumoMaterial, label: 'Variável' },
];

export default function ProjTipoRamalMaterialForm({
  onSubmit,
  initialValues,
  loading = false,
  contratos,
  tiposRamal,
  materiais,
}: Props) {
  const [form] = Form.useForm<ProjTipoRamalMaterialFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.resetFields();
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout='vertical' onFinish={onSubmit}>
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
          name='tipoRamalId'
          label='Tipo de Ramal'
          rules={[{ required: true, message: 'Tipo de ramal é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder='Selecione o tipo de ramal'
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={tiposRamal.map((tipo) => ({
              value: tipo.id,
              label: tipo.nome,
            }))}
          />
        </Form.Item>

        <Form.Item
          name='materialId'
          label='Material'
          rules={[{ required: true, message: 'Material é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder='Selecione o material'
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={materiais.map((material) => ({
              value: material.id,
              label: `${material.codigo} - ${material.descricao}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          name='quantidadeBase'
          label='Quantidade Base'
          rules={[{ required: true, message: 'Quantidade base é obrigatória' }]}
        >
          <InputNumber
            min={0.0001}
            precision={4}
            style={{ width: '100%' }}
            placeholder='Quantidade base'
          />
        </Form.Item>

        <Form.Item
          name='tipoConsumo'
          label='Tipo de Consumo'
          rules={[{ required: true, message: 'Tipo de consumo é obrigatório' }]}
        >
          <Select options={TIPO_CONSUMO_OPTIONS} placeholder='Selecione o tipo de consumo' />
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
