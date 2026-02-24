'use client';

import { Button, DatePicker, Form, Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect } from 'react';

import { listEquipes } from '@/lib/actions/equipe/list';
import { listSupervisores } from '@/lib/actions/supervisor/list';
import { useDataFetch } from '@/lib/hooks/useDataFetch';

export interface VinculoFormData {
  supervisorId: number;
  equipeId: number;
  inicio: Dayjs;
  fim?: Dayjs | null;
}

interface VinculoFormProps {
  onSubmit: (values: { supervisorId: number; equipeId: number; inicio: Date; fim?: Date | null }) => void;
  initialValues?: Partial<VinculoFormData & { id: number }>;
  loading?: boolean;
}

export default function VinculoForm({ onSubmit, initialValues, loading = false }: VinculoFormProps) {
  const [form] = Form.useForm<VinculoFormData>();

  // Carregar equipes e supervisores
  const { data: dadosVinculo, loading: loadingSelects } = useDataFetch(
    async () => {
      const [eqRes, supRes] = await Promise.all([
        listEquipes({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' }),
        listSupervisores({ page: 1, pageSize: 100, orderBy: 'nome', orderDir: 'asc' }),
      ]);

      if (eqRes.success && eqRes.data && supRes.success && supRes.data) {
        return {
          equipes: eqRes.data.data || [],
          supervisores: supRes.data.data || [],
        };
      }
      throw new Error('Erro ao carregar dados');
    },
    []
  );

  const equipes = dadosVinculo?.equipes || [];
  const supervisores = dadosVinculo?.supervisores || [];

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        supervisorId: initialValues.supervisorId,
        equipeId: initialValues.equipeId,
        inicio: initialValues.inicio ? dayjs(initialValues.inicio) : undefined,
        fim: initialValues.fim ? dayjs(initialValues.fim) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [initialValues, form]);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={(vals) =>
        onSubmit({
          supervisorId: vals.supervisorId,
          equipeId: vals.equipeId,
          inicio: vals.inicio.toDate(),
          fim: vals.fim ? vals.fim.toDate() : null,
        })
      }
    >
      <Form.Item
        name="supervisorId"
        label="Supervisor"
        rules={[{ required: true, message: 'Supervisor é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o supervisor"
          loading={loadingSelects}
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={supervisores.map((s) => ({ value: s.id, label: s.nome }))}
        />
      </Form.Item>

      <Form.Item name="equipeId" label="Equipe" rules={[{ required: true, message: 'Equipe é obrigatória' }]}>
        <Select
          placeholder="Selecione a equipe"
          loading={loadingSelects}
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={equipes.map((e) => ({ value: e.id, label: e.nome }))}
        />
      </Form.Item>

      <Form.Item name="inicio" label="Início" rules={[{ required: true, message: 'Data de início é obrigatória' }]}>
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item name="fim" label="Fim">
        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading || loadingSelects}>
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
