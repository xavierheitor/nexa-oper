'use client';

import { Button, Form, Input, Select, Spin } from 'antd';
import { useEffect } from 'react';

const { TextArea } = Input;

export const PROJECT_STATUS_OPTIONS = [
  { value: 'PENDENTE', label: 'Aguardando Viabilização' },
  { value: 'EM_VIABILIZACAO', label: 'Em Viabilização' },
  { value: 'AGUARDANDO_VALIDACAO', label: 'Aguardando Validação' },
  { value: 'EM_CORRECAO', label: 'Em Correção' },
  { value: 'VIABILIZADO_PARCIAL', label: 'Viabilizado Parcial' },
  { value: 'VIABILIZADO_TOTAL', label: 'Viabilizado Total' },
  { value: 'EM_PLANEJAMENTO', label: 'Em Planejamento' },
  { value: 'EM_EXECUCAO', label: 'Em Execução' },
  { value: 'FINALIZADO', label: 'Finalizado' },
  { value: 'CANCELADO', label: 'Cancelado' },
] as const;

export type ProjectStatusValue = (typeof PROJECT_STATUS_OPTIONS)[number]['value'];

export interface ProjProjetoFormData {
  programaId: number;
  numeroProjeto: string;
  descricao: string;
  equipamento: string;
  municipio: string;
  status: ProjectStatusValue;
}

interface ProgramaOption {
  id: number;
  nome: string;
  contrato?: {
    nome: string;
    numero?: string | null;
  } | null;
}

interface Props {
  onSubmit: (values: ProjProjetoFormData) => void | Promise<void>;
  initialValues?: Partial<ProjProjetoFormData>;
  loading?: boolean;
  programas: ProgramaOption[];
}

export default function ProjProjetoForm({
  onSubmit,
  initialValues,
  loading = false,
  programas,
}: Props) {
  const [form] = Form.useForm<ProjProjetoFormData>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
      return;
    }

    form.resetFields();
    form.setFieldsValue({
      status: 'PENDENTE',
    });
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
          name='programaId'
          label='Programa'
          rules={[{ required: true, message: 'Programa é obrigatório' }]}
        >
          <Select
            showSearch
            placeholder='Selecione o programa'
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={programas.map((programa) => ({
              value: programa.id,
              label: programa.contrato?.numero
                ? `${programa.nome} (${programa.contrato.numero})`
                : programa.nome,
            }))}
          />
        </Form.Item>

        <Form.Item
          name='numeroProjeto'
          label='Número do Projeto'
          rules={[
            { required: true, message: 'Número do projeto é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Número do projeto deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input autoFocus placeholder='Digite o número do projeto' />
        </Form.Item>

        <Form.Item
          name='descricao'
          label='Descrição'
          rules={[
            { required: true, message: 'Descrição é obrigatória' },
            {
              min: 1,
              max: 5000,
              message: 'Descrição deve ter entre 1 e 5000 caracteres',
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder='Descreva o projeto'
            showCount
            maxLength={5000}
          />
        </Form.Item>

        <Form.Item
          name='municipio'
          label='Município'
          rules={[
            { required: true, message: 'Município é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Município deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input placeholder='Digite o município' />
        </Form.Item>

        <Form.Item
          name='equipamento'
          label='Equipamento'
          rules={[
            { required: true, message: 'Equipamento é obrigatório' },
            {
              min: 1,
              max: 255,
              message: 'Equipamento deve ter entre 1 e 255 caracteres',
            },
          ]}
        >
          <Input placeholder='Digite o equipamento' />
        </Form.Item>

        <Form.Item
          name='status'
          label='Status'
          rules={[{ required: true, message: 'Status é obrigatório' }]}
        >
          <Select options={PROJECT_STATUS_OPTIONS.map((option) => ({ ...option }))} />
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
