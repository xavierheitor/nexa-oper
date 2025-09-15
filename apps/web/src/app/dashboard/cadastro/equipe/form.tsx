'use client';

import { Button, Form, Input, Select, Spin, message } from 'antd';
import { useEffect, useState } from 'react';

import { listContratos } from '@/lib/actions/contrato/list';
import { listTiposEquipe } from '@/lib/actions/tipoEquipe/list';

import { Contrato, TipoEquipe } from '@nexa-oper/db';

export interface EquipeFormData {
  nome: string;
  tipoEquipeId: number;
  contratoId: number;
}

interface EquipeFormProps {
  onSubmit: (values: EquipeFormData) => void;
  initialValues?: Partial<EquipeFormData>;
  loading?: boolean;
}

export default function EquipeForm({
  onSubmit,
  initialValues,
  loading = false,
}: EquipeFormProps) {
  const [form] = Form.useForm();

  const [tiposEquipe, setTiposEquipe] = useState<TipoEquipe[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(true);

  useEffect(() => {
    const loadSelectData = async () => {
      try {
        setLoadingSelects(true);
        const [tiposResponse, contratosResponse] = await Promise.all([
          listTiposEquipe({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' }),
          listContratos({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' }),
        ]);
        setTiposEquipe(tiposResponse.data?.data || []);
        setContratos(contratosResponse.data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados dos selects:', error);
        message.error('Erro ao carregar dados dos selects');
      } finally {
        setLoadingSelects(false);
      }
    };
    loadSelectData();
  }, []);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  if (loading) return <Spin spinning />;

  return (
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Nome da Equipe"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
        ]}
      >
        <Input autoFocus placeholder="Digite o nome da equipe" />
      </Form.Item>

      <Form.Item
        name="tipoEquipeId"
        label="Tipo de Equipe"
        rules={[{ required: true, message: 'Tipo de equipe é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o tipo de equipe"
          loading={loadingSelects}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={tiposEquipe.map((t) => ({ value: t.id, label: t.nome }))}
        />
      </Form.Item>

      <Form.Item
        name="contratoId"
        label="Contrato"
        rules={[{ required: true, message: 'Contrato é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o contrato"
          loading={loadingSelects}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={contratos.map((c) => ({ value: c.id, label: `${c.nome} (${c.numero})` }))}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading || loadingSelects}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}

