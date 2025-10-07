/**
 * Formulário de Período de Escala
 *
 * Componente reutilizável para criação e edição de períodos de escala
 */

'use client';

import React, { useEffect, useState } from 'react';
import { Form, Select, DatePicker, Input, Button, Space, Alert } from 'antd';
import { useServerData } from '@/lib/hooks/useServerData';
import { listEquipes } from '@/lib/actions/equipe/list';
import { listTiposEscala } from '@/lib/actions/escala/tipoEscala';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface EscalaEquipePeriodoFormProps {
  initialValues?: {
    equipeId?: number;
    periodoInicio?: Date;
    periodoFim?: Date;
    tipoEscalaId?: number;
    observacoes?: string;
  };
  onSubmit: (values: unknown) => Promise<void>;
  onCancel: () => void;
}

export default function EscalaEquipePeriodoForm({
  initialValues,
  onSubmit,
  onCancel,
}: EscalaEquipePeriodoFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  // Carregar equipes
  const { data: equipes, loading: equipesLoading } = useServerData({
    fetchAction: listEquipes,
    params: {
      page: 1,
      pageSize: 100,
      orderBy: 'nome',
      orderDir: 'asc',
    },
  });

  // Carregar tipos de escala
  const { data: tiposEscala, loading: tiposLoading } = useServerData({
    fetchAction: listTiposEscala,
    params: {
      page: 1,
      pageSize: 100,
      orderBy: 'nome',
      orderDir: 'asc',
      ativo: true,
    },
  });

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Converter datas do RangePicker
      const submitData = {
        ...values,
        periodoInicio: values.periodo[0].toDate(),
        periodoFim: values.periodo[1].toDate(),
      };
      delete submitData.periodo;

      await onSubmit(submitData);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  // Valores iniciais com conversão de datas
  const formInitialValues = initialValues
    ? {
        ...initialValues,
        periodo: initialValues.periodoInicio && initialValues.periodoFim
          ? [dayjs(initialValues.periodoInicio), dayjs(initialValues.periodoFim)]
          : undefined,
      }
    : {};

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={formInitialValues}
      onFinish={handleSubmit}
    >
      <Alert
        message="Período de Escala"
        description="Configure o período de trabalho de uma equipe com um tipo de escala específico."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item
        name="equipeId"
        label="Equipe"
        rules={[{ required: true, message: 'Equipe é obrigatória' }]}
      >
        <Select
          placeholder="Selecione uma equipe"
          loading={equipesLoading}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={equipes?.data?.map((equipe: any) => ({
            value: equipe.id,
            label: equipe.nome,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="tipoEscalaId"
        label="Tipo de Escala"
        rules={[{ required: true, message: 'Tipo de escala é obrigatório' }]}
      >
        <Select
          placeholder="Selecione o tipo (4x2, 5x1, Espanhola, etc)"
          loading={tiposLoading}
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
          options={tiposEscala?.data?.map((tipo: any) => ({
            value: tipo.id,
            label: `${tipo.nome} - ${tipo.modoRepeticao === 'CICLO_DIAS' ? 'Ciclo' : 'Semanal'}`,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="periodo"
        label="Período"
        rules={[{ required: true, message: 'Período é obrigatório' }]}
      >
        <RangePicker
          format="DD/MM/YYYY"
          style={{ width: '100%' }}
          placeholder={['Data Início', 'Data Fim']}
        />
      </Form.Item>

      <Form.Item
        name="observacoes"
        label="Observações"
      >
        <Input.TextArea
          rows={3}
          placeholder="Observações sobre este período de escala..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Alert
        message="Próximos Passos"
        description="Após criar o período, você poderá gerar os slots automaticamente e atribuir eletricistas."
        type="success"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            Salvar
          </Button>
          <Button onClick={onCancel}>
            Cancelar
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}

