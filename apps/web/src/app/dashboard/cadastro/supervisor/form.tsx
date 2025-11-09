'use client';

import { Button, Form, Input, Select, Spin, App } from 'antd';
import { useEffect, useState } from 'react';

import { listContratos } from '@/lib/actions/contrato/list';
import { Contrato } from '@nexa-oper/db';

export interface SupervisorFormData {
  nome: string;
  contratoId: number;
}

interface SupervisorFormProps {
  onSubmit: (values: SupervisorFormData) => void;
  initialValues?: Partial<SupervisorFormData>;
  loading?: boolean;
}

export default function SupervisorForm({
  onSubmit,
  initialValues,
  loading = false,
}: SupervisorFormProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loadingSelects, setLoadingSelects] = useState(true);

  useEffect(() => {
    const loadSelectData = async () => {
      try {
        setLoadingSelects(true);
        const contratosResponse = await listContratos({
          page: 1,
          pageSize: 100,
          orderBy: 'nome',
          orderDir: 'asc',
        });
        setContratos(contratosResponse.data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);
        message.error('Erro ao carregar contratos');
      } finally {
        setLoadingSelects(false);
      }
    };
    loadSelectData();
  }, [message]);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  return (
    <Spin spinning={loading}>
      <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item
        name="nome"
        label="Nome do Supervisor"
        rules={[
          { required: true, message: 'Nome é obrigatório' },
          { min: 1, max: 255, message: 'Nome deve ter entre 1 e 255 caracteres' },
        ]}
      >
        <Input autoFocus placeholder="Digite o nome do supervisor" />
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
    </Spin>
  );
}

